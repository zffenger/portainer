package errors

import "errors"

var (
	ErrObjectNotFound = errors.New("Object not found inside the database")
	ErrWrongDBEdition = errors.New("Your current database is set for Portainer Business Edition, please downgrade it from Business Edition first using '--rollback-to-ce' flag.")
)
