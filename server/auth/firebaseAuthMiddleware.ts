import { Request, Response, NextFunction } from 'express'
import { Socket } from 'socket.io'
import { ExtendedError } from 'socket.io/dist/namespace'
import { verifyToken } from '.'

async function authMiddleware(
    socket: Socket,
    next: (err?: ExtendedError | undefined) => void,
) {
    // const headerToken = socket.request.headers.authorization
    const headerToken = socket.handshake.auth.token

    if (!headerToken) {
        next(new Error("No token"))
    }

    if (headerToken && headerToken.split(' ')[0] !== 'Bearer') {
        next(new Error("Invalid token"))
    }

    const token: string = headerToken.split(' ')[1]
    verifyToken(token)
        .then((claims: any) => {
            if(!claims.name) claims.name = 'Guest'
            ; (socket.request as any).currentUser = claims
            next()
        })
        .catch(error => {

            next(new Error("something went wrong"))
        })
}

export default authMiddleware