/** Express API router for docker API single match game servers in get5 using MatchZy image.
 * @module routes/docker
 * @requires express
 * @requires dockerode
 */
/**
 * @swagger
 * resourcePath: /docker
 * description: Express API for docker API calls in G5API.
 */
import { Router } from "express";
import config from "config";
import Utils from "../../utility/utils.js";
var Docker = require('dockerode');

const router: Router = Router();

interface ContainerInfo {
  id: number;
  docker: {
    useDocker: boolean;
    useSocket: boolean;
    socket?: string;
    host?: string;
    port?: number;
  };
  port: number;
  host: string;
  created_at: number;
}

let containers: ContainerInfo[] = []; // create in-memory active containers array

let newcontainer:number = 0
let server_port = 27015
const DOCKER_HOST = process.env.DOCKER_HOST || config.get("docker.host") || "localhost"
const DOCKER_PORT = Number(process.env.DOCKER_PORT || config.get("docker.port"))
// or use socket
const DOCKER_SOCKET = process.env.DOCKER_SOCKET || config.get("docker.socket_file")

const useDocker = Boolean(config.get("docker.useDocker"));
if (typeof(useDocker) != "boolean") {
  console.log("[Docker] Please use 0 / 1 / false / true in config when specifying whenever to use or not use docker.")
}
const useSocket = !!DOCKER_SOCKET

const docker = useSocket
  ? new Docker({ socketPath: DOCKER_SOCKET })
  : new Docker({ host: DOCKER_HOST, port: DOCKER_PORT });

async function spinupGameServer(docker:any, container_id:number, server_port:number) {
  await docker.createContainer({
    Image: "xbird/cs2-matchzy",
    name: `${container_id}`,
    ExposedPorts: {
      "27015/tcp": {}
    },
    HostConfig: {
      PortBindings: {
        "27015/tcp": [{ HostPort: server_port.toString() }]
      }
    }
  });
}

router.get("/",Utils.ensureAuthenticated, (req, res)=>{
  try {
  if (req.user && Utils.adminCheck(req.user)) {
    res.send(containers)
  } else {
      return res.status(403).json({ message: "You are not authorized to do this." })
    }
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: (err as Error).toString() })
  }
})
router.post("/create", Utils.ensureAuthenticated, async (req, res) => {
  try {
    if (req.user && Utils.superAdminCheck(req.user)) {
      const container_id = newcontainer++;
      const gameport = server_port++;
      const containerInfo: ContainerInfo = useSocket ? {
            id: container_id,
            docker: {
              useDocker: true,
              useSocket: true,
              socket: DOCKER_SOCKET
            },
            port: gameport,
            host: DOCKER_HOST,
            created_at: Date.now()
          }
        : {
            id: container_id,
            docker: {
              useDocker: true,
              useSocket: false,
              host: DOCKER_HOST,
              port: DOCKER_PORT
            },
            port: gameport,
            host: DOCKER_HOST,
            created_at: Date.now()
          };
      containers.push(containerInfo)
      await spinupGameServer(docker, container_id, gameport)
      return res.json(containerInfo)
    } else {
      return res.status(403).json({ message: "You are not authorized to do this." })
    }
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: (err as Error).toString() })
  }
})