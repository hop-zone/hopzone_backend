import { Socket } from "socket.io"

export class PlayerController {
    public socket: Socket


    constructor(socket: Socket){
        this.socket = socket
    }

    enableListeners = () => {
        this.socket.on('f2b_moveLeft', () => {
            console.log('move left');
            
        })
    }
}