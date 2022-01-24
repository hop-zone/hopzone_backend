import { Game } from "../../entities/Game";

export const moveEnemies = (state: Game) => {
    state.enemies = state.enemies.map((e) => {
        e.x += e.xSpeed

        if (Math.abs(e.originXpos - e.x) > e.movingRange) {
            e.xSpeed = -e.xSpeed
        }

        return e
    })

    return state
};
