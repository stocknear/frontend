.PHONY: mock-data dev-mock dev

# Generate mock fixture JSON from CSVs
mock-data:
	node scripts/generate-mock-data.js

# Start dev server with mock data (regenerates fixtures first)
dev-mock: mock-data
	VITE_MOCK_DATA=true \
	VITE_USEAST_POCKETBASE_URL=http://localhost:8090 \
	VITE_USEAST_API_URL=http://localhost:9999 \
	VITE_USEAST_FASTIFY_URL=http://localhost:9998 \
	VITE_USEAST_WS_URL=ws://localhost:9997 \
	STOCKNEAR_API_KEY=mock-key \
	npx vite dev --port 5173

# Normal dev server (requires real .env)
dev:
	npx vite dev --port 5173
