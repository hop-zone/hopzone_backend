import { Game } from "../../entities/Game"

export const movePlatforms = (state: Game) => {
    state.movingPlatforms = state.movingPlatforms.map((p) => {
        p.x += p.xSpeed

        if (Math.abs(p.originXpos - p.x) > p.movingRange) {
            p.xSpeed = -p.xSpeed
        }
        return p
    })

    return state
}