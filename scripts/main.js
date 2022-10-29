import {world, Location,Vector,BlockLocation,MinecraftBlockTypes} from '@minecraft/server';
import {Server} from './modules/server';

const server = new Server();

world.events.entityHurt.subscribe(eventData => entityHurtEvent(eventData));

async function entityHurtEvent(eventData) {
    const {damagingEntity, hurtEntity} = eventData;
    const health = hurtEntity.getComponent('health');
    if (health.current <= 0) {
        const items = await server.asyncWaitForEvent('entityCreate',(eventData) => {
            const entity = eventData.entity;
            const itemComponent = entity.getComponent('item');
            if (itemComponent && 
                Math.abs(hurtEntity.location.x - entity.location.x) < 0.5 &&
                Math.abs(hurtEntity.location.y - entity.location.y) < 0.5 &&
                Math.abs(hurtEntity.location.z - entity.location.z) < 0.5
            ) {
                const itemStack = itemComponent.itemStack;
                const spawnLocation = entity.location;
                entity.kill();
                return {stack:itemStack,location:spawnLocation};
            } else return 0;
        },1,10,0);
        const radius = (health.value/10) + 2;
        const location = new Location(hurtEntity.location.x,hurtEntity.location.y,hurtEntity.location.z);
        hurtEntity.dimension.createExplosion(location, radius, {
            source: hurtEntity,
            allowUnderwater: true,
            causesFire: true,
            breaksBlocks: true
        });
        for (const item of items) {
            if (damagingEntity?.typeId === 'minecraft:player') {
                damagingEntity.getComponent('inventory').container.addItem(item.stack);
            } else {
                const blockUnder = hurtEntity.dimension.getBlockFromRay(item.location, new Vector(0,-1,0), {includeLiquidBlocks:false,includePassableBlocks:false,maxDistance:360}).location;
                const blockToTeleport = hurtEntity.dimension.getBlock(new BlockLocation(blockUnder.x,blockUnder.y+1,blockUnder.z));
                blockToTeleport.setType(MinecraftBlockTypes.air);
                hurtEntity.dimension.spawnItem(item.stack,blockUnder);
            }
        }
    }
}