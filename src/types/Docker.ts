export interface ContainerInfo {
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