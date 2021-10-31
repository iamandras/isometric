class MapEngine {
    constructor(map, objectMap, objectTypeMapping) {
        this.map = map;
        this.objectMap = objectMap;
        this.objectTypeMapping = objectTypeMapping;
    }

    isometricToScreen(point) {
        return {
            x: point.x * TILE_WIDTH_HALF - point.y * TILE_WIDTH_HALF,
            y: point.x * TILE_HEIGHT_HALF + point.y * TILE_HEIGHT_HALF
        };
    }

    screenToIsometric(point) {
        return {
            x: Math.floor((point.x / TILE_WIDTH_HALF + point.y / TILE_HEIGHT_HALF) / 2),
            y: Math.floor((point.y / TILE_HEIGHT_HALF - (point.x / TILE_WIDTH_HALF)) / 2)
        };
    }

    _renderObject(isoPoint, screenPoint, objectType) {
        return `
            <div
                id="object_${isoPoint.x}_${isoPoint.y}"
                data-x="${isoPoint.x}"
                data-y="${isoPoint.y}"
                class="ground object obj${objectType}"
                style="left: ${screenPoint.x}px; top: ${screenPoint.y}px">
            </div>`;
    }

    _renderGroundTile(isoPoint, screenPoint, tileType) {
        return `
            <div
                id="tile_${isoPoint.x}_${isoPoint.y}"
                data-x="${isoPoint.x}"
                data-y="${isoPoint.y}"
                class="ground tile tile${tileType}"
                data-tile="${tileType}"
                style="left: ${screenPoint.x}px; top: ${screenPoint.y}px"
                ></div>
            `;
    }

    drawMap() {
        let html = '';

        // draw the map
        for (let y = 0; y < this.map.length; ++y) {
            const row = this.map[y];
            for (let x = 0; x < row.length; ++x) {
                const tile = row[x];
                if (tile === 0) {
                    continue;
                }

                const screenPoint = this.isometricToScreen({x, y});
                html += this._renderGroundTile({x, y}, screenPoint, tile);
            }
        }

        // draw the object map
        for (let y = 0; y < this.objectMap.length; ++y) {
            const row = this.objectMap[y];
            for (let x = 0; x < row.length; ++x) {
                const objectType = row[x];
                if (objectType === 0 || objectType > 997) {
                    continue;
                }

                const screenPoint = this.isometricToScreen({x, y});
                const objectTypeScreenSettings = this.objectTypeMapping[objectType - 1];
                screenPoint.x -= objectTypeScreenSettings.xChange;
                screenPoint.y -= objectTypeScreenSettings.yChange;

                html += this._renderObject({x, y}, screenPoint, objectType);
            }
        }

        $s.append($s.$('map'), html);
        this._arrangeZIndexes();
    }

    _arrangeZIndexes() {
        const selector = $s.$('selector');
        $s.setCss(selector, 'z-index', MAX_MAP_WIDTH * MAX_MAP_HEIGHT + 1);
        const player = $s.$('player');

        const tiles = $s.getElements('.tile');
        for (let i = 0; i < tiles.length; ++i) {
            const tile = tiles[i];
            const x = parseInt($s.getAttribute(tile, 'data-x'));
            const y = parseInt($s.getAttribute(tile, 'data-y'));

            $s.setCss(tile, 'z-index', y * MAX_MAP_WIDTH + x);
            $s.setCss(player, 'z-index', y * MAX_MAP_WIDTH + x);
        }

        const objects = $s.getElements('.object');
        for (let i = 0; i < objects.length; ++i) {
            const object = objects[i];
            const x = parseInt($s.getAttribute(object, 'data-x'));
            const y = parseInt($s.getAttribute(object, 'data-y'));

            $s.setCss(object, 'z-index', MAX_MAP_WIDTH * MAX_MAP_HEIGHT + 5 + y * MAX_MAP_WIDTH + x);
        }
    }

    _extendArrayTillIsoPoint(array, isoPoint) {
        if (array.length <= isoPoint.y) {
            for (let y = array.length - 1; y < isoPoint.y; y++) {
                array.push([]);
            }
        }

        const row = array[isoPoint.y];
        if (row.length <= isoPoint.x) {
            for (let x = row.length - 1; x < isoPoint.x; x++) {
                row.push(0);
            }
        }
    }

    _putGroundTile(isoPoint, tileType) {
        this._extendArrayTillIsoPoint(this.map, isoPoint);
        const row = this.map[isoPoint.y];
        row[isoPoint.x] = tileType;
    }

    addObject(isoPoint, screenPoint, objectType) {
        const html = this._renderObject(isoPoint, screenPoint, objectType);
        $s.append($s.$('map'), html);

        this._arrangeZIndexes();
        this._putObject(isoPoint, objectType);
    }

    addOrChangeGroundTile(isometricPoint, tileType) {
        const tile = $s.$(`tile_${isometricPoint.x}_${isometricPoint.y}`);

        if (tile === null) {
            const screenPoint = this.isometricToScreen({x: isometricPoint.x, y: isometricPoint.y});
            this._putGroundTile(isometricPoint, tileType);
            const html = this._renderGroundTile(isometricPoint, screenPoint, tileType);
            $s.append($s.$('map'), html);
            this._arrangeZIndexes();
            return;
        }

        const tileTypeOfExistingTile = $s.getAttribute(tile, 'data-tile');
        $s.setAttribute(tile, 'data-tile', tileType);
        $s.removeClasses(tile, ['tile' + tileTypeOfExistingTile]);
        $s.addClass(tile, 'tile' + tileType);

        this._putGroundTile(isometricPoint, tileType);
    }

    _setValueForObjectMap(isoPoint, value) {
        const row = this.objectMap[isoPoint.y];
        row[isoPoint.x] = value;
    }

    _getObjectMapValue(isoPoint) {
        const row = this.objectMap[isoPoint.y];
        return row[isoPoint.x];
    }

    deleteObject(isoPoint) {
        const matrix = [
            [0, 998, 999],
            [1000, 1001, 1002],
        ];

        let startIsoPoint = isoPoint;
        const row = this.objectMap[isoPoint.y];
        const pointValue = row[isoPoint.x];

        if (pointValue >= 998) {
            for (let y = 0; y < matrix.length; y++) {
                const matrixRow = matrix[y];
                for (let x = 0; x < matrixRow.length; x++) {
                    const matrixValue = matrixRow[x];
                    if (matrixValue === pointValue) {
                        startIsoPoint.x = isoPoint.x - x;
                        startIsoPoint.y = isoPoint.y - y;
                        break;
                    }
                }
            }
        }

        const objectType = this._getObjectMapValue(startIsoPoint);
        const settings = this.objectTypeMapping[objectType - 1];
        for (let y = 0; y < settings.ySize; y++) {
            for (let x = 0; x < settings.xSize; x++) {
                this._setValueForObjectMap({x: startIsoPoint.x + x, y: startIsoPoint.y + y}, 0);
            }
        }

        const element = $s.$(`object_${startIsoPoint.x}_${startIsoPoint.y}`);
        $s.remove(element);

        this._arrangeZIndexes();
    }

    deleteGroundTile(isoPoint) {
        this._extendArrayTillIsoPoint(this.map, isoPoint);
        const row = this.map[isoPoint.y];
        row[isoPoint.x] = 0;

        const element = $s.$(`tile_${isoPoint.x}_${isoPoint.y}`);
        $s.remove(element);

        this._arrangeZIndexes();
    }

    _putObject(isoPoint, objectType) {
        const objectSettings = this.objectTypeMapping[objectType - 1];

        this._extendArrayTillIsoPoint(
            this.objectMap,
            {
                x: isoPoint.x + objectSettings.xSize - 1,
                y: isoPoint.y + objectSettings.ySize - 1
            }
        );

        const matrix = [
            [objectType, 998, 999],
            [1000, 1001, 1002],
        ];

        for (let y = 0; y < objectSettings.ySize; ++y) {
            for (let x = 0; x < objectSettings.xSize; ++x) {
                this._setValueForObjectMap({x: isoPoint.x + x, y: isoPoint.y + y}, matrix[y][x]);
            }
        }
    }

    hasIsoPointATile(isoPoint) {
        if (this.map.length - 1 < isoPoint.y) {
            return false;
        }

        const row = this.map[isoPoint.y];
        if (row.length - 1 < isoPoint.x) {
            return false;
        }

        return row[isoPoint.x] !== 0;
    }

    hasIsoPointAnObject(isoPoint) {
        if (this.objectMap.length - 1 < isoPoint.y) {
            return false;
        }

        const row = this.objectMap[isoPoint.y];
        if (row.length - 1 < isoPoint.x) {
            return false;
        }

        return row[isoPoint.x] !== 0;
    }

    _loadHitmapForObject(objectType) {
        const hitmapCanvasId = `obj${objectType}hitmap`;
        const hitmaps = $s.$('hitmaps');
        $s.append(hitmaps, `<canvas id="${hitmapCanvasId}" width="500" height="500"></canvas>`);
        const hitmap = document.getElementById(hitmapCanvasId);
        const context = hitmap.getContext('2d');

        const hitmapImage = new Image();

        hitmapImage.onload = function () {
            context.drawImage(hitmapImage, 0, 0);
        };

        hitmapImage.src = `/own_isometric/objects/obj${objectType}_hitmap.png`;
    }

    isObjectHit(screenPoint, objectType) {
        const hitmap = document.getElementById(`obj${objectType}hitmap`);
        const context = hitmap.getContext('2d');
        const pixelData = context.getImageData(screenPoint.x, screenPoint.y, 1, 1).data;

        return pixelData[0] === 255 && pixelData[1] === 255 && pixelData[2] === 255;
    }

    getHitBoxes() {
        const list = [];
        for (let y = 0; y < this.objectMap.length; ++y) {
            const row = this.objectMap[y];
            for (let x = 0; x < row.length; ++x) {
                const objectType = row[x];
                if (objectType === 0 || objectType === 1000) {
                    continue;
                }

                const screenPoint = this.isometricToScreen({x, y});
                const objectTypeScreenSettings = this.objectTypeMapping[objectType - 1];
                screenPoint.x -= objectTypeScreenSettings.xChange;
                screenPoint.y -= objectTypeScreenSettings.yChange;
                const width = objectTypeScreenSettings.width;
                const height = objectTypeScreenSettings.height;
                const z = y * MAX_MAP_WIDTH + x;
                list.push({isoPoint: {x, y}, screenPoint, width, height, objectType, z});
            }
        }

        return list;
    }

    getFirstEmptyTileForPlayer() {
        for (let y = 0; y < this.map.length; ++y) {
            const row = this.map[y];
            for (let x = 0; x < row.length; ++x) {
                if ([1, 2, 3].indexOf(row[x]) !== -1) {
                    if (!this.hasIsoPointAnObject({x, y})) {
                        return {x, y};
                    }
                }
            }
        }

        return {x: 0, y: 0};
    }

    movePlayerTo(playerPoint) {
        const screenPoint = this.isometricToScreen(playerPoint);
        const player = $s.$('player');
        $s.setPosition(player, {x: (screenPoint.x + 128 / 2 - 20 / 2), y: screenPoint.y});
        this._arrangeZIndexes();
    }

    init() {
        this._loadHitmapForObject(1);
        this._loadHitmapForObject(2);
        this._loadHitmapForObject(3);
        this._loadHitmapForObject(4);

        this.drawMap();
        this._arrangeZIndexes();
    }
}