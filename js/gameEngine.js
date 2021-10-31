class GameEngine {
    constructor(mapEngine, playerPoint) {
        this.MODE_BUILD_TILE = 0;
        this.MODE_BUILD_OBJECT = 1;
        this.MODE_DELETE = 2;

        this.MODE_PLAY = 4;
        this.mode = this.MODE_BUILD_TILE;
        this.modeParameter = 1;

        this.mapEngine = mapEngine;
        this.mouseDown = false;
        this.mouseMoving = false;
        this.originalMouseX = 0;
        this.originalMouseY = 0;
        this.originalMapX = 0;
        this.originalMapY = 0;
        this.playerPoint = playerPoint;
    }

    _enableSelector(selectorType) {
        const selector = $s.$('selector');
        $s.removeClasses(selector, ['wrong', 'good', 'move']);
        $s.addClass(selector, selectorType);
        $s.show(selector);
    }

    _disableSelector() {
        const selector = $s.$('selector');
        $s.hide(selector);
    }

    changeMode(link, selectedMode, parameter) {
        this.mode = selectedMode;
        this.modeParameter = parameter;
        const links = $s.getElements('#overlay a');
        links.forEach(l => $s.removeClasses(l, ['active']));
        $s.addClass(link, 'active');
        this._enableSelector('wrong');

        if (selectedMode === this.MODE_PLAY) {
            if (!this.mapEngine.hasIsoPointATile(this.playerPoint) ||
                this.mapEngine.hasIsoPointAnObject(this.playerPoint)) {
                this.playerPoint = this.mapEngine.getFirstEmptyTileForPlayer();
                this.mapEngine.movePlayerTo(this.playerPoint);
            }
        }
    }

    _saveData() {
        localStorage.setItem('map', JSON.stringify(this.mapEngine.map));
        localStorage.setItem('objectMap', JSON.stringify(this.mapEngine.objectMap));
    }

    _loadFromStorage() {
        if (localStorage.getItem('map') === null || localStorage.getItem('objectMap') === null) {
            return;
        }

        this.mapEngine.map = JSON.parse(localStorage.getItem('map'));
        this.mapEngine.objectMap = JSON.parse(localStorage.getItem('objectMap'));
    }

    _getMousePosition(event, isTouchInterface) {
        return isTouchInterface ?
            {x: event.changedTouches[0].pageX, y: event.changedTouches[0].pageY} :
            {x: event.pageX, y: event.pageY};
    }

    _onMouseDown(event, isTouchInterface) {
        event.preventDefault();
        if (isTouchInterface && event.changedTouches.length > 1) {
            return;
        }

        const mousePosition = this._getMousePosition(event, isTouchInterface);
        this.mouseDown = true;
        this.mouseMoving = false;
        this.originalMouseX = mousePosition.x;
        this.originalMouseY = mousePosition.y;
        const map = $s.$('map');
        const mapPos = $s.getPosition(map);
        this.originalMapX = mapPos.x;
        this.originalMapY = mapPos.y;
    }

    _onMouseMove(event, isTouchInterface) {
        event.preventDefault();
        if (isTouchInterface && event.changedTouches.length > 1) {
            return;
        }

        const selector = $s.$('selector');
        const screen = $s.$('screen');
        const map = $s.$('map');

        const mousePosition = this._getMousePosition(event, isTouchInterface);

        if (this.mouseDown &&
            (Math.abs(mousePosition.x - this.originalMouseX) > 5 ||
                Math.abs(mousePosition.y - this.originalMouseY) > 5)) {
            this.mouseMoving = true;
            $s.addClass(screen, 'grabbing');
        }

        if (this.mouseDown && this.mouseMoving) {
            gsap.to(
                map,
                {
                    x: this.originalMapX + (mousePosition.x - this.originalMouseX),
                    y: this.originalMapY + (mousePosition.y - this.originalMouseY),
                    duration: 0.1,
                    repeat: 0,
                    ease: 'none',
                }
            );

            return;
        }

        if (!this.mouseDown && $s.getCss(selector, 'display') === 'block') {
            const mapOffset = $s.getPosition(map);

            const x = mousePosition.x - mapOffset.x - TILE_WIDTH_HALF;
            const y = mousePosition.y - mapOffset.y;

            const isoPoint = this.mapEngine.screenToIsometric({x, y});
            if (isoPoint.x < 0 || isoPoint.y < 0) {
                return;
            }

            $s.setPosition(selector, this.mapEngine.isometricToScreen(isoPoint));
        }
    }

    _nextPlayerStep() {
        const playerPathStep = this.playerPath[this.playerPathIndex];
        this.playerPoint = {x: playerPathStep.y, y: playerPathStep.x};
        this.mapEngine.movePlayerTo(this.playerPoint);
        this.playerPathIndex++;
        if (this.playerPathIndex > this.playerPath.length - 1) {
            this.playerMoveTimer = null;
            return;
        }

        this.playerMoveTimer = setTimeout(() => {
            this._nextPlayerStep()
        }, 100);
    }

    _onMouseUp(event, isTouchInterface) {
        event.preventDefault();
        if (isTouchInterface && event.changedTouches.length > 1) {
            return;
        }

        this.mouseDown = false;
        const screen = $s.$('screen');

        $s.removeClasses(screen, ['grabbing']);

        if (this.mouseMoving) {
            this.mouseMoving = false;
            return;
        }

        const mousePosition = this._getMousePosition(event, isTouchInterface);

        const map = $s.$('map');
        const mapOffset = $s.getPosition(map);

        const pageX = mousePosition.x - mapOffset.x - TILE_WIDTH_HALF;
        const pageY = mousePosition.y - mapOffset.y;

        const isometricPoint = this.mapEngine.screenToIsometric({x: pageX, y: pageY});
        if (isometricPoint.x < 0 || isometricPoint.y < 0) {
            return;
        }

        if (this.mode === this.MODE_PLAY) {
            const matrix = this._setupMatrixForPathFinder();
            const graph = new Graph(matrix);

            const start = graph.grid[this.playerPoint.y][this.playerPoint.x];
            const end = graph.grid[isometricPoint.y][isometricPoint.x];

            if (this.playerMoveTimer !== null) {
                clearTimeout(this.playerMoveTimer);
                this.playerMoveTimer = null;
            }

            this.playerPath = astar.search(graph, start, end);
            this.playerPathIndex = 0;
            this.playerMoveTimer = setTimeout(() => {
                this._nextPlayerStep()
            }, 100);
            return;
        }

        if (this.mode === this.MODE_DELETE) {
            if (this.mapEngine.hasIsoPointAnObject(isometricPoint)) {
                this.mapEngine.deleteObject(isometricPoint);
                this._saveData();
                return;
            }

            if (!this.mapEngine.hasIsoPointATile(isometricPoint)) {
                return;
            }

            this.mapEngine.deleteGroundTile(isometricPoint);
            this._saveData();

            return;
        }

        if (this.mode === this.MODE_BUILD_OBJECT) {
            if (this.mapEngine.hasIsoPointAnObject(isometricPoint)) {
                return;
            }

            const screenPoint = this.mapEngine.isometricToScreen({x: isometricPoint.x, y: isometricPoint.y});
            const objectTypeScreenSettings = objectTypeMapping[this.modeParameter - 1];
            screenPoint.x -= objectTypeScreenSettings.xChange;
            screenPoint.y -= objectTypeScreenSettings.yChange;

            this.mapEngine.addObject(isometricPoint, screenPoint, this.modeParameter);
            this._saveData();

            return;
        }

        if (this.mode === this.MODE_BUILD_TILE) {
            this.mapEngine.addOrChangeGroundTile(isometricPoint, this.modeParameter);
            this._saveData();
        }
    }

    _setupListeners() {
        const self = this;
        const screen = $s.$('screen');
        $s.on(screen, 'mousedown', (event) => {
            self._onMouseDown(event, false)
        });
        $s.on(screen, 'mousemove', (event) => {
            self._onMouseMove(event, false)
        });
        $s.on(screen, 'mouseup', (event) => {
            self._onMouseUp(event, false)
        });

        $s.on(screen, 'touchstart', (event) => {
            self._onMouseDown(event, true)
        });
        $s.on(screen, 'touchmove', (event) => {
            self._onMouseMove(event, true)
        });
        $s.on(screen, 'touchend', (event) => {
            self._onMouseUp(event, true)
        });

    }

    _setupMatrixForPathFinder() {
        const matrix = [];
        for (let y = 0; y < this.mapEngine.map.length; ++y) {
            const row = this.mapEngine.map[y];
            const matrixRow = [];
            matrix.push(matrixRow);

            for (let x = 0; x < row.length; ++x) {
                if (!this.mapEngine.hasIsoPointATile({x, y}) ||
                    this.mapEngine.hasIsoPointAnObject({x, y})) {
                    matrixRow.push(0);
                    continue;
                }

                matrixRow.push(1);
            }
        }

        return matrix;
    }

    init() {
        this._loadFromStorage();
        this._setupListeners();
        this.mapEngine.movePlayerTo(this.playerPoint);
    }
}

