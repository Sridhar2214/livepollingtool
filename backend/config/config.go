package config

import (
	"os"
)

type Config struct {
	Port         string
	MongoURI     string
	DBName       string
	RedisAddr    string
	RedisPass    string
	JWTSecret    string
	ClientOrigin string
}

func LoadConfig() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}

	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "livepoll_db"
	}

	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}

	redisPass := os.Getenv("REDIS_PASSWORD")

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "livepoll-guvi-hcl-internship-secret-key-2026"
	}

	clientOrigin := os.Getenv("CLIENT_ORIGIN")
	if clientOrigin == "" {
		clientOrigin = "*"
	}

	return &Config{
		Port:         port,
		MongoURI:     mongoURI,
		DBName:       dbName,
		RedisAddr:    redisAddr,
		RedisPass:    redisPass,
		JWTSecret:    jwtSecret,
		ClientOrigin: clientOrigin,
	}
}
