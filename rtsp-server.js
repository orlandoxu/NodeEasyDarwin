const net = require('net');
const ip = require('@penggy/internal-ip');
const RTSPSession = require('rtsp-session');
const events = require('events');

// 作者的文章
// https://blog.csdn.net/xiejiashu/article/details/86699995

class RTSPServer extends events.EventEmitter {
    constructor(port = 554) {
        super();
        this.port = port;
        // path <-> session
        this.pushSessions = {};
        // path <-> [sessions]
        this.playSessions = {};
        this.server = net.createServer();
        this.server.on("connection", socket => {
            new RTSPSession(socket, this);
        }).on("error", err => {
            console.error('rtsp server error:', err);
        }).on("listening", async () => {
            var host = await ip.v4();
            var env = process.env.NODE_ENV || "development";
            console.log(`EasyDarwin rtsp server listening on rtsp://${host}:${this.port} in ${env} mode`);
        })
    }

    start() {
        this.server.listen(this.port);
        this.stats();
    }

    stats() {
        require('routes/stats').rtspServer = this;
    }

    addSession(session) {
        if(session.type == 'pusher') {
            this.pushSessions[session.path] = session;
            console.log('new pusher, path ', session.path)
        } else if(session.type == 'player') {
            console.log('new player, path ', session.path)
            var playSessions = this.playSessions[session.path];
            if(!playSessions) {
                playSessions = [];
                this.playSessions[session.path] = playSessions;
            }
            playSessions.push(session);
        }
    }

    removeSession(session) {
        if(session.type == 'pusher') {
            delete this.pushSessions[session.path];
        } else if(session.type == 'player') {
            var playSessions = this.playSessions[session.path];
            if(playSessions && playSessions.length > 0) {
                var idx = playSessions.indexOf(session);
                if(idx >= 0) {
                    playSessions.splice(idx, 1);
                }
            }
        }
    }
}

module.exports = RTSPServer;
