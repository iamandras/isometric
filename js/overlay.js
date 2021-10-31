class Overlay {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
    }

    addLink(column, config) {
        let image = ``;
        if (config.svg) {
            image = `<svg><use href="#${config.svg}" /></svg>`;
        }

        if (config.img) {
            image = `<img src="${config.img}" style="width:32px;height:32px"/>`;
        }

        let param = '';
        if (config.parameter) {
            param = `, ${config.parameter}`;
        }

        const clazz = config.active ? 'active' : '';

        const html = `
            <a href="javascript:void(0)" class="${clazz}" onclick="gameEngine.changeMode(this, ${config.mode}${param})">${image}</a>
        `;

        const overlay = $s.$('overlayCol' + column);
        $s.append(overlay, html);
    }

    init() {
        this.addLink(1, { mode: this.gameEngine.MODE_PLAY, svg: 'play' });
        this.addLink(2, { mode: this.gameEngine.MODE_DELETE, svg: 'delete' });
        this.addLink(3, { mode: this.gameEngine.MODE_BUILD_TILE, parameter: 1, active: true, img: '/128x64/tile1.png' });

        this.addLink(1, { mode: this.gameEngine.MODE_BUILD_TILE, parameter: 13, img: '/128x64/tile13.png' });
        this.addLink(2, { mode: this.gameEngine.MODE_BUILD_TILE, parameter: 7, img: '/128x64/tile7.png' });
        this.addLink(3, { mode: this.gameEngine.MODE_BUILD_TILE, parameter: 12, img: '/128x64/tile12.png' });
        this.addLink(1, { mode: this.gameEngine.MODE_BUILD_TILE, parameter: 4, img: '/128x64/tile4.png' });
        this.addLink(2, { mode: this.gameEngine.MODE_BUILD_TILE, parameter: 1, img: '/128x64/tile1.png' });
        this.addLink(3, { mode: this.gameEngine.MODE_BUILD_TILE, parameter: 6, img: '/128x64/tile6.png' });

        this.addLink(1, { mode: this.gameEngine.MODE_BUILD_TILE, parameter: 15, img: '/128x64/tile15.png' });
        this.addLink(2, { mode: this.gameEngine.MODE_BUILD_TILE, parameter: 5, img: '/128x64/tile5.png' });
        this.addLink(3, { mode: this.gameEngine.MODE_BUILD_TILE, parameter: 14, img: '/128x64/tile14.png' });

        this.addLink(1, { mode: this.gameEngine.MODE_BUILD_TILE, parameter: 9, img: '/128x64/tile9.png' });
        this.addLink(2, { mode: this.gameEngine.MODE_BUILD_TILE, parameter: 8, img: '/128x64/tile8.png' });
        this.addLink(3, { mode: this.gameEngine.MODE_BUILD_TILE, parameter: 2, img: '/128x64/tile2.png' });

        this.addLink(1, { mode: this.gameEngine.MODE_BUILD_TILE, parameter: 11, img: '/128x64/tile11.png' });
        this.addLink(2, { mode: this.gameEngine.MODE_BUILD_TILE, parameter: 10, img: '/128x64/tile10.png' });
        this.addLink(3, { mode: this.gameEngine.MODE_BUILD_TILE, parameter: 3, img: '/128x64/tile3.png' });


        this.addLink(1, { mode: this.gameEngine.MODE_BUILD_OBJECT, parameter: 1, img: '/objects/obj1_thumb.png' });
        this.addLink(2, { mode: this.gameEngine.MODE_BUILD_OBJECT, parameter: 2, img: '/objects/obj2_thumb.png' });
        this.addLink(3, { mode: this.gameEngine.MODE_BUILD_OBJECT, parameter: 3, img: '/objects/obj3_thumb.png' });
        this.addLink(1, { mode: this.gameEngine.MODE_BUILD_OBJECT, parameter: 4, img: '/objects/obj4_thumb.png' });
    }
}