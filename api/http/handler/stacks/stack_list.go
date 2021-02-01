package stacks

import (
	httperrors "github.com/portainer/portainer/api/http/errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
)

type stackListOperationFilters struct {
	SwarmID               string `json:"SwarmID"`
	EndpointID            int    `json:"EndpointID"`
	IncludeOrphanedStacks bool   `json:"IncludeOrphanedStacks"`
}

// GET request on /api/stacks?(filters=<filters>)
func (handler *Handler) stackList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var filters stackListOperationFilters
	err := request.RetrieveJSONQueryParameter(r, "filters", &filters, true)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: filters", err}
	}

	endpoints, err := handler.DataStore.Endpoint().Endpoints()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints from database", err}
	}

	stacks, err := handler.DataStore.Stack().Stacks()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve stacks from the database", err}
	}
	stacks = filterStacks(stacks, &filters, endpoints)

	resourceControls, err := handler.DataStore.ResourceControl().ResourceControls()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve resource controls from the database", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	stacks = authorization.DecorateStacks(stacks, resourceControls)

	if !securityContext.IsAdmin {
		if filters.IncludeOrphanedStacks {
			return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access orphaned stacks", httperrors.ErrUnauthorized}
		}

		user, err := handler.DataStore.User().User(securityContext.UserID)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user information from the database", err}
		}

		userTeamIDs := make([]portainer.TeamID, 0)
		for _, membership := range securityContext.UserMemberships {
			userTeamIDs = append(userTeamIDs, membership.TeamID)
		}

		stacks = authorization.FilterAuthorizedStacks(stacks, user, userTeamIDs)
	}

	return response.JSON(w, stacks)
}

func filterStacks(stacks []portainer.Stack, filters *stackListOperationFilters, endpoints []portainer.Endpoint) []portainer.Stack {
	if filters.EndpointID == 0 && filters.SwarmID == "" {
		return stacks
	}

	filteredStacks := make([]portainer.Stack, 0, len(stacks))
	for _, stack := range stacks {
		if filters.IncludeOrphanedStacks && isOrphanedStack(stack, endpoints) {
			if (stack.Type == portainer.DockerComposeStack && filters.SwarmID == "") || (stack.Type == portainer.DockerSwarmStack && filters.SwarmID != "") {
				filteredStacks = append(filteredStacks, stack)
			}
			continue
		}

		if stack.Type == portainer.DockerComposeStack && stack.EndpointID == portainer.EndpointID(filters.EndpointID) {
			filteredStacks = append(filteredStacks, stack)
		}
		if stack.Type == portainer.DockerSwarmStack && stack.SwarmID == filters.SwarmID {
			filteredStacks = append(filteredStacks, stack)
		}
	}

	return filteredStacks
}

func isOrphanedStack(stack portainer.Stack, endpoints []portainer.Endpoint) bool {
	for _, endpoint := range endpoints {
		if stack.EndpointID == endpoint.ID {
			return false
		}
	}

	return true
}
