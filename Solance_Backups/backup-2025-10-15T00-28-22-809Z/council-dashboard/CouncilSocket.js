// council-dashboard/CouncilSocket.js

import { io } from 'socket.io-client';

const SOCKET_URL = process.env.COUNCIL_SOCKET_URL || 'http://localhost:3000';
let socket = null;

export function initCouncilSocket() {
	if (!socket) {
		socket = io(SOCKET_URL, { autoConnect: true });
	}
	return socket;
}

export function getCouncilSocket() {
	return socket;
}

// Default export for convenience in front-end imports
const councilSocket = initCouncilSocket();
export default councilSocket;
