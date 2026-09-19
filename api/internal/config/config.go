package config

import "os"

const (
	defaultAddress       = ":8081"
	defaultAllowedOrigin = "http://localhost:5173"
)

type Config struct {
	Address       string
	AllowedOrigin string
}

func Load() Config {
	return Config{
		Address:       envOrDefault("API_ADDRESS", defaultAddress),
		AllowedOrigin: envOrDefault("API_ALLOWED_ORIGIN", defaultAllowedOrigin),
	}
}

func envOrDefault(name, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}
