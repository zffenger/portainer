package stacks

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"sync"

	"github.com/docker/docker/api/types"
	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/docker"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
)

var (
	errStackAlreadyExists = errors.New("A stack already exists with this name")
	errStackNotExternal   = errors.New("Not an external stack")
)

// Handler is the HTTP handler used to handle stack operations.
type Handler struct {
	stackCreationMutex *sync.Mutex
	stackDeletionMutex *sync.Mutex
	requestBouncer     *security.RequestBouncer
	*mux.Router
	DataStore           portainer.DataStore
	DockerClientFactory *docker.ClientFactory
	FileService         portainer.FileService
	GitService          portainer.GitService
	SwarmStackManager   portainer.SwarmStackManager
	ComposeStackManager portainer.ComposeStackManager
	KubernetesDeployer  portainer.KubernetesDeployer
}

// NewHandler creates a handler to manage stack operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router:             mux.NewRouter(),
		stackCreationMutex: &sync.Mutex{},
		stackDeletionMutex: &sync.Mutex{},
		requestBouncer:     bouncer,
	}
	h.Handle("/stacks",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackCreate))).Methods(http.MethodPost)
	h.Handle("/stacks",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackList))).Methods(http.MethodGet)
	h.Handle("/stacks/{id}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackInspect))).Methods(http.MethodGet)
	h.Handle("/stacks/{id}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackDelete))).Methods(http.MethodDelete)
	h.Handle("/stacks/{id}/associate",
		bouncer.AdminAccess(httperror.LoggerHandler(h.stackAssociate))).Methods(http.MethodPut)
	h.Handle("/stacks/{id}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackUpdate))).Methods(http.MethodPut)
	h.Handle("/stacks/{id}/file",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackFile))).Methods(http.MethodGet)
	h.Handle("/stacks/{id}/migrate",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackMigrate))).Methods(http.MethodPost)
	h.Handle("/stacks/{id}/start",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackStart))).Methods(http.MethodPost)
	h.Handle("/stacks/{id}/stop",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackStop))).Methods(http.MethodPost)
	return h
}

func (handler *Handler) userCanAccessStack(securityContext *security.RestrictedRequestContext, endpointID portainer.EndpointID, resourceControl *portainer.ResourceControl) (bool, error) {
	user, err := handler.DataStore.User().User(securityContext.UserID)
	if err != nil {
		return false, err
	}

	userTeamIDs := make([]portainer.TeamID, 0)
	for _, membership := range securityContext.UserMemberships {
		userTeamIDs = append(userTeamIDs, membership.TeamID)
	}

	if resourceControl != nil && authorization.UserCanAccessResource(securityContext.UserID, userTeamIDs, resourceControl) {
		return true, nil
	}

	return handler.userIsAdminOrEndpointAdmin(user, endpointID)
}

func (handler *Handler) userIsAdmin(userID portainer.UserID) (bool, error) {
	user, err := handler.DataStore.User().User(userID)
	if err != nil {
		return false, err
	}

	isAdmin := user.Role == portainer.AdministratorRole

	return isAdmin, nil
}

func (handler *Handler) userIsAdminOrEndpointAdmin(user *portainer.User, endpointID portainer.EndpointID) (bool, error) {
	isAdmin := user.Role == portainer.AdministratorRole

	return isAdmin, nil
}

func (handler *Handler) userCanCreateStack(securityContext *security.RestrictedRequestContext, endpointID portainer.EndpointID) (bool, error) {
	user, err := handler.DataStore.User().User(securityContext.UserID)
	if err != nil {
		return false, err
	}

	return handler.userIsAdminOrEndpointAdmin(user, endpointID)
}

func (handler *Handler) checkUniqueName(endpoint *portainer.Endpoint, name string, stackID portainer.StackID, swarmMode bool) (bool, error) {
	stacks, err := handler.DataStore.Stack().Stacks()
	if err != nil {
		return false, err
	}

	for _, stack := range stacks {
		if strings.EqualFold(stack.Name, name) && (stackID == 0 || stackID != stack.ID) && stack.EndpointID == endpoint.ID {
			return false, nil
		}
	}

	dockerClient, err := handler.DockerClientFactory.CreateClient(endpoint, "")
	if err != nil {
		return false, err
	}
	defer dockerClient.Close()
	if swarmMode {
		services, err := dockerClient.ServiceList(context.Background(), types.ServiceListOptions{})
		if err != nil {
			return false, err
		}

		for _, service := range services {
			serviceNS, ok := service.Spec.Labels["com.docker.stack.namespace"]
			if ok && serviceNS == name {
				return false, nil
			}
		}
	}

	containers, err := dockerClient.ContainerList(context.Background(), types.ContainerListOptions{All: true})
	if err != nil {
		return false, err
	}

	for _, container := range containers {
		containerNS, ok := container.Labels["com.docker.compose.project"]

		if ok && containerNS == name {
			return false, nil
		}
	}

	return true, nil
}
