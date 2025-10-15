export async function spinupGameServer(docker:any, container_id:number, server_port:number) {
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