import net from 'net';

export const isPortAvailable = (port) =>
  new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', (error) => {
        if (error.code === 'EADDRINUSE') resolve(false);
        else resolve(false);
      })
      .once('listening', () => {
        tester
          .once('close', () => resolve(true))
          .close();
      })
      .listen(port);
  });
