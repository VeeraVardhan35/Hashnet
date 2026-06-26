import assert from "assert";
import { ColyseusTestServer, boot } from "@colyseus/testing";
import { LobbyState } from "../src/rooms/schema/LobbyState.js";
import { MyRoom } from "../src/rooms/MyRoom.js";

describe("Hashet Lobby Room", () => {
  let colyseus: ColyseusTestServer;

  before(async () => {
    colyseus = await boot({
      initializeGameServer: (gameServer: any) => {
        gameServer.define("lobby", MyRoom);
      },
    });
  });

  after(async () => colyseus.shutdown());

  beforeEach(async () => await colyseus.cleanup());

  it("connecting into a lobby room", async () => {
    const room = await colyseus.createRoom<LobbyState>("lobby", {});
    const client1 = await colyseus.connectTo(room, { username: "TestPlayer" });

    assert.strictEqual(client1.sessionId, room.clients[0].sessionId);

    await room.waitForNextPatch();

    assert.ok(room.state.players.size === 1);
    assert.ok(room.state.roomCode.length === 6);
  });
});
