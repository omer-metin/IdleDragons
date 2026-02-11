import Matter from 'matter-js';

class PhysicsSystem {
    constructor() {
        this.engine = Matter.Engine.create();
        this.runner = Matter.Runner.create();

        // Disable gravity for top-down or side-scrolling RPG style (custom gravity)
        // Or keep it for side-scrolling platformer. Assuming "Walking Party", let's keep gravity 0 for top-down or standard for side-scroller.
        // "Idle Side Scroller" usually has gravity. Let's assume side-view walking.
        this.engine.world.gravity.y = 1;

        this.entities = new Map(); // Map<SpriteID, Body>
    }

    addBody(sprite, body) {
        Matter.Composite.add(this.engine.world, body);
        this.entities.set(sprite, body);
    }

    removeBody(sprite) {
        const body = this.entities.get(sprite);
        if (body) {
            Matter.Composite.remove(this.engine.world, body);
            this.entities.delete(sprite);
        }
    }

    update(deltaTime) {
        // MatterJS runner uses fixed delta, but we can step manually
        Matter.Engine.update(this.engine, deltaTime * 1000 / 60); // Normalize to ~16ms steps

        // Sync Sprites to Bodies
        for (const [sprite, body] of this.entities) {
            sprite.x = body.position.x;
            sprite.y = body.position.y;
            sprite.rotation = body.angle;
        }
    }
}

export default new PhysicsSystem();
