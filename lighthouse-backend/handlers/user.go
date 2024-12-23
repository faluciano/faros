package handlers

import (
	"encoding/json"
	"lighthouse-backend/db"
	"net/http"
)

func GetUserByID(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	userFromdb, err := db.GetUser(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(userFromdb)
}
