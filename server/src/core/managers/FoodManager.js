import { MAP_SIZE, FOOD_COUNT, FOOD_RADIUS, XP_PER_FOOD } from 'shared/constants';

export class FoodManager {
    constructor(game) {
        this.game = game;
        this.foods = new Map();
        this.foodIdCounter = 0;
    }

    init() {
        for (let i = 0; i < FOOD_COUNT; i++) {
            this.spawnFood();
        }
    }

    spawnFood() {
        const id = ++this.foodIdCounter;
        const x = Math.random() * (MAP_SIZE - 100) + 50;
        const y = Math.random() * (MAP_SIZE - 100) + 50;

        const food = {
            id,
            x,
            y,
            radius: FOOD_RADIUS,
            xp: XP_PER_FOOD,
            color: this.getRandomColor()
        };

        this.foods.set(id, food);
        return food;
    }

    getRandomColor() {
        const colors = [0x00ff00, 0x00ffff, 0xffff00, 0xff00ff, 0xff8800];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    collectFood(foodId, player) {
        const food = this.foods.get(foodId);
        if (!food) return false;

        if (player.xp !== undefined) {
            player.xp += food.xp;
        }

        this.foods.delete(foodId);
        this.spawnFood();

        return true;
    }

    checkCollision(player) {
        const collected = [];

        this.foods.forEach((food, id) => {
            const dx = player.x - food.x;
            const dy = player.y - food.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < player.radius + food.radius) {
                collected.push(id);
            }
        });

        collected.forEach(id => this.collectFood(id, player));

        return collected.length;
    }

    getFoodsData() {
        return Array.from(this.foods.values());
    }
}
