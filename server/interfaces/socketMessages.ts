export enum SocketMessages {
    connectionFailed = 'connect_error',
    connectionSuccess = 'connect',
    activeRooms = 'b2f_gamerooms',
    lobbyInfo = 'b2f_lobby',
    joinLobby = 'f2b_joinLobby',
    leaveLobby = 'f2b_leaveLobby',
    gameState = 'b2f_gameState',
    moveLeft = 'f2b_moveLeft',
    moveRight = 'f2b_moveRight',
    stopMoving = 'f2b_stopMoving',
    gameLoading = 'b2f_gameLoading',
    getScoreboard = 'f2b_scoreboard',
    scoreboard = 'b2f_scoreboard',
    newLobby = 'f2b_newLobby',
    startGame = 'f2b_startGame',
    restartGame = 'f2b_restartGame'
  }