import { Game } from "../../entities/Game";

export const moveEnemies = (state: Game) => {
    state.enemies = state.enemies.map((e) => {
        e.y += e.ySpeed

        return e
    })

    return state
};
