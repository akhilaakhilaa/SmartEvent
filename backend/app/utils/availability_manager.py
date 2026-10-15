
from fastapi import WebSocket
from typing import Dict, Set
import asyncio


class AvailabilityManager:
    def __init__(self):
        self.connections: Dict[int, Set[WebSocket]] = {}
        self.lock = asyncio.Lock()

    async def connect(self, event_id: int, websocket: WebSocket):
        await websocket.accept()

        async with self.lock:
            if event_id not in self.connections:
                self.connections[event_id] = set()

            self.connections[event_id].add(websocket)

    async def disconnect(self, event_id: int, websocket: WebSocket):
        async with self.lock:
            connections = self.connections.get(event_id)

            if connections:
                connections.discard(websocket)

                if not connections:
                    self.connections.pop(event_id, None)

    async def broadcast(self, event_id: int, available_tickets: int):
        message = {
            "event_id": event_id,
            "available_tickets": available_tickets,
            "type": "availability_update",
        }

        async with self.lock:
            connections = list(self.connections.get(event_id, set()))

        disconnected = []

        for websocket in connections:
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected.append(websocket)

        for websocket in disconnected:
            await self.disconnect(event_id, websocket)


availability_manager = AvailabilityManager()
