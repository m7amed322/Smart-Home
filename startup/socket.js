module.exports = (io) => {
    io.on('connection', (socket) => {
        socket.on('Joining', (userId) => {
            socket.join(userId);
        });
    });
};