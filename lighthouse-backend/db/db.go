package db

import (
	"log"
	"os"
	"sync"

	supa "github.com/nedpals/supabase-go"
)

// set up the Supabase client and initialize it for all the other calls
var (
	supabase     *supa.Client
	initSupabase sync.Once
)

func initializeSupabase() {
	SUPABASE_URL := os.Getenv("SUPABASE_URL")
	SUPABASE_KEY := os.Getenv("SUPABASE_KEY")
	supabase = supa.CreateClient(SUPABASE_URL, SUPABASE_KEY)

	if supabase == nil {
		log.Fatal("Failed to create Supabase client")
	}
}
