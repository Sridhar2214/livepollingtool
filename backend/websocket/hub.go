package websocket

import (
	"context"
	"log"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/livepoll/backend/database"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for WebSocket connections
	},
}

type Client struct {
	PollID string
	Conn   *websocket.Conn
	Send   chan string
}

type WSHub struct {
	mu         sync.RWMutex
	pollRooms  map[string]map[*Client]bool
	redisStore *database.RedisService
}

var Hub *WSHub

func InitHub(redisStore *database.RedisService) *WSHub {
	h := &WSHub{
		pollRooms:  make(map[string]map[*Client]bool),
		redisStore: redisStore,
	}
	Hub = h
	return h
}

func (h *WSHub) HandleWebSocket(c *gin.Context) {
	pollID := c.Param("id")
	if pollID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Poll ID is required"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println("❌ Failed to upgrade WebSocket:", err)
		return
	}

	client := &Client{
		PollID: pollID,
		Conn:   conn,
		Send:   make(chan string, 256),
	}

	h.registerClient(client)

	// Writer goroutine
	go func() {
		defer func() {
			conn.Close()
		}()
		for message := range client.Send {
			err := conn.WriteMessage(websocket.TextMessage, []byte(message))
			if err != nil {
				break
			}
		}
	}()

	// Reader goroutine (reads ping/pong or client messages)
	go func() {
		defer func() {
			h.unregisterClient(client)
			conn.Close()
		}()
		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				break
			}
		}
	}()
}

func (h *WSHub) registerClient(client *Client) {
	h.mu.Lock()
	if h.pollRooms[client.PollID] == nil {
		h.pollRooms[client.PollID] = make(map[*Client]bool)
		// Start Redis PubSub listener goroutine for this new room if first client
		go h.listenRedisPubSub(client.PollID)
	}
	h.pollRooms[client.PollID][client] = true
	roomCount := len(h.pollRooms[client.PollID])
	h.mu.Unlock()

	log.Printf("🔌 Client connected to Poll [%s]. Active clients in room: %d", client.PollID, roomCount)
}

func (h *WSHub) unregisterClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if room, ok := h.pollRooms[client.PollID]; ok {
		if _, exists := room[client]; exists {
			delete(room, client)
			close(client.Send)
			if len(room) == 0 {
				delete(h.pollRooms, client.PollID)
			}
			log.Printf("🔌 Client disconnected from Poll [%s].", client.PollID)
		}
	}
}

func (h *WSHub) listenRedisPubSub(pollID string) {
	ctx := context.Background()
	eventCh, cleanup := h.redisStore.SubscribeToPoll(ctx, pollID)
	defer cleanup()

	log.Printf("📡 Subscribed Redis PubSub channel for Poll [%s]", pollID)

	for msg := range eventCh {
		h.mu.RLock()
		room, exists := h.pollRooms[pollID]
		if !exists || len(room) == 0 {
			h.mu.RUnlock()
			log.Printf("📡 Closing PubSub listener for Poll [%s] (no active clients)", pollID)
			return
		}

		for client := range room {
			select {
			case client.Send <- msg:
			default:
				log.Printf("⚠️ Client send channel full, skipping message for Poll [%s]", pollID)
			}
		}
		h.mu.RUnlock()
	}
}
