import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier"
import { Socket } from "socket.io"

export const decodeToken = (socket: Socket): DecodedIdToken => {
    return (socket.request as any).currentUser as DecodedIdToken
}