import { Socket } from "socket.io";
import { ExtendedError } from "socket.io/dist/namespace";
import { SocketMessages } from "../interfaces/socketMessages";

const loggingMiddleware = async (socket: Socket, next: (err?: ExtendedError | undefined) => void,
) => {


    const user = (socket.request as any).currentUser

    console.log('User connected to the socket server: ' + user.name);

    socket.on("disconnect", () => {
        console.log("User disconnected from the socket server: " + user.name);
    })

    socket.on(SocketMessages.newLobby, () => {
        console.log(`Creating a new lobby requested by ${user.name}`);

    })

    socket.on(SocketMessages.joinLobby, (lobbyId: string) => {
        console.log(`User ${user.name} joined lobby with ID: ${lobbyId}`)

    })

    socket.on(SocketMessages.leaveLobby, (lobbyId: string) => {
        console.log(`User ${user.name} left lobby with ID: ${lobbyId}`)
    })

    socket.on(SocketMessages.startGame, (id: string) => {
        console.log(`User ${user.name} requested to start game with ID: ${id}`);
    })

    next()
};




export default loggingMiddleware