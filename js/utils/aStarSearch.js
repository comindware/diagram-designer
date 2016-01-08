define([], function() {
    var end = { x: 340, y: 50 };

    var nodes = [];
    var arcs = [];

    function pointsEqual(p1, p2) {
        return p1.x == p2.x && p1.y == p2.y;
    }

    function addNode(p1) {
        var existing = _.findWhere(nodes, { x: p1.x, y: p1.y });
        if (existing == null) {
            nodes.push(p1);
            return true;
        }
    }

    function addArc(p1, p2) {
        addNode(p1);
        addNode(p2);

        var d = Math.sqrt((p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y));
        var existing = _.find(arcs, function(arc) {
            return pointsEqual(arc.p1, p1) && pointsEqual(arc.p2, p2);
        });
        if (existing == null)
        {
            arcs.push({
                p1: p1,
                p2: p2,
                weight: d * 1.5
            })
        }
    }

    function nodeHits(node, rects) {
        return _.find(rects, function(rect) {
            return node.x > rect.x && node.x < rect.x + rect.width &&
                node.y > rect.y && node.y < rect.y + rect.height;
        });
    }

    function xRelate(node, rect) {
        return node.x <= rect.x ? -1 : (node.x >= rect.x + rect.width ? 1 : 0);
    }

    function yRelate(node, rect) {
        return node.y <= rect.y ? -1 : (node.y >= rect.y + rect.height ? 1 : 0);
    }

    function relate(node, rect) {
        return {
            x: xRelate(node, rect),
            y: yRelate(node, rect)
        }
    }

    function arcHits(arc, rects) {
        return _.find(rects, function(rect) {
            var r1 = relate(arc.p1, rect);
            var r2 = relate(arc.p2, rect);
            return (r1.x == 0 && r2.x == 0 && r1.y != r2.y) ||
                (r1.y == 0 && r2.y == 0 && r1.x != r2.x);
        });
    }

    function positionHeuristic(position, goal) {
        return distance(position, goal);
    }

    function distance(position, goal) {
        return Math.sqrt((position.x - goal.x) * (position.x - goal.x) + (position.y - goal.y) * (position.y - goal.y));
    }

    function manhattanDistance(position, goal) {
        return Math.abs(position.x - goal.x) + Math.abs(position.y - goal.y);
    }


    var config = {
        hitPenalty: 5.0,
        passingCost: 1.0,
        insidePassingCost: 2.5,
        hitEvade: 1.3,
        offroad: {
            use: false,
            step: 50.0
        },
        shortCost: 50,
        shortThreshold: 10,
        passCharge: 0,
        turnCharge: 30,
        backCharge: 120,
        goalBackCharge: 200,
        splitThreshold: 5200
    };

    function vector(position1, position2) {
        var dx = position2.x - position1.x;
        var dy = position2.y - position1.y;
        return {
            x: dx == 0 ? 0 : (dx/Math.abs(dx)),
            y: dy == 0 ? 0 : (dy/Math.abs(dy))
        }
    }

    function inverseVector(position1, position2) {
        var v = vector(position1, position2);
        return {
            x: -v.x,
            y: -v.y
        }
    }

    function vectorDiff(vector1, vector2) {
        return Math.max(Math.abs(vector2.x - vector1.x), Math.abs(vector2.y - vector1.y));
    }

    function calcCost(state, goal, p, rects) {
        var p1h = nodeHits(state.position, rects);
        var p2h = nodeHits(p, rects);
        var ah = arcHits({ p1: state.position, p2: p }, rects);

        var goalSprint = (goal.x == p.x && goal.y == p.y);
        if (goalSprint && p2h) {
            ah = false;
            p2h = false;
        }

        var d = distance(state.position, p);
        var result = 0;

        if (d > 0 && d < config.shortThreshold)
            result = state.cost + 1/d * config.shortCost;

        else if (!p1h && !p2h && !ah)
            result = state.cost + config.passCharge + d * config.passingCost;

        else if (p1h && p2h)
            result = state.cost + d * config.insidePassingCost;

        else if (p2h || ah)
            result = state.cost + d * config.hitPenalty;

        else if (p1h && !p2h)
            return state.cost + d * config.hitEvade;
        else
            result = state.cost + d * config.passingCost;

        if (state.vector) {
            var v = vector(state.position, p);
            var diff = vectorDiff(v, state.vector);
            if (diff == 1) result += config.turnCharge;
            else if (diff == 2) result += config.backCharge;
        }

        if (goal.vector && goal.x == p.x && goal.y == p.y) {
            var vG = vector(state.position, p);
            var diffG = vectorDiff(v, goal.vector);
            if (diffG == 2) {
                result += config.goalBackCharge;
            }
        }

        return result;
    }

    function nextOffroadStates(state, goal, rects) {
        var dx = goal.x - state.position.x;
        var dy = goal.x - state.position.y;

        if (dx == 0 && dy == 0)
            return;

        var variants = [
            {
                x: state.position.x,
                y: state.position.y - config.offroad.step,
                d: 0
            },
            {
                x: state.position.x + config.offroad.step,
                y: state.position.y,
                d: 1
            },
            {
                x: state.position.x,
                y: state.position.y + config.offroad.step,
                d: 2
            },
            {
                x: state.position.x - config.offroad.step,
                y: state.position.y,
                d: 3
            }
        ];

        if (Math.abs(dx) < config.offroad.step) {
            variants.push({
                x: goal.x,
                y: state.position.y,
                d: dx > 0 ? 1 : 3
            });
        }

        if (Math.abs(dy) < config.offroad.step) {
            variants.push({
                x: state.position.x,
                y: goal.y,
                d: dy > 0 ? 2 : 0
            })
        }

        var result = [];

        _.each(variants, function(px) {
            var pd = state.d || -1;
            var cd = px.d;
            result.push({
                position: px,
                heuristic: positionHeuristic(px, goal),
                cost: calcCost(state.cost, state.position, px, rects) * (pd == cd ? 1.0 : 1.01),
                previous: state,
                d: cd
            });
        });

        return result;
    }

    function gridAware(position, grid) {
        if (!grid)
            return position;

        return {
            x: grid.x ? Math.round(position.x / grid.x) * grid.x + grid.hashOffset.x : position.x,
            y: grid.y ? Math.round(position.y / grid.y) * grid.y + grid.hashOffset.y : position.y
        }
    }

    function goalGridAware(position, goal, grid) {
        if (position.x == goal.x || position.y == goal.y)
            return position;

        return gridAware(position, grid);
    }

    function goalGridAwareX(position, goal, grid) {
        var aware = goalGridAware(position, goal, grid);

        return {
            x: aware.x,
            y: position.y
        }
    }

    function goalGridAwareY(position, goal, grid) {
        var aware = goalGridAware(position, goal, grid);

        return {
            x: position.x,
            y: aware.y
        }
    }

    function nextStates(state, goal, rects, grid) {

        var dx = goal.x - state.position.x;
        var dy = goal.y - state.position.y;

        var result = [];

        if (Math.abs(dx) > 0) {
            var nextDx = { x: goal.x, y: state.position.y };
            var dxHit = nodeHits(nextDx, rects) || arcHits({ p1: state.position, p2: nextDx }, rects);

            result.push({
                position: nextDx,
                heuristic: positionHeuristic(nextDx, goal),
                cost: calcCost(state, goal, nextDx, rects),
                previous: state,
                vector: vector(state.position, nextDx),
                type: "moving straight by x"
            });

            if (dxHit) {
                var dx1 = goalGridAwareX({ x: dxHit.x + (dx < 0 ? dxHit.width : 0), y : state.position.y }, goal, grid);

                if (state.position.x != dx1.x) {
                    result.push({
                        position: dx1,
                        heuristic: positionHeuristic(dx1, goal),
                        cost: calcCost(state, goal, dx1, rects),
                        previous: state,
                        vector: vector(state.position, dx1),
                        type: "closing down rect"
                    });

                    var dx21 = goalGridAwareY({x: state.position.x, y: dxHit.y}, goal, grid);
                    result.push({
                        position: dx21,
                        heuristic: positionHeuristic(dx21, goal),
                        cost: calcCost(state, goal, dx21, rects),
                        previous: state,
                        vector: vector(state.position, dx21),
                        type: "evading distant rect by top"
                    });
                    var dx31 = goalGridAwareY({x: state.position.x, y: dxHit.y + dxHit.height}, goal, grid);
                    result.push({
                        position: dx31,
                        heuristic: positionHeuristic(dx31, goal),
                        cost: calcCost(state, goal, dx31, rects),
                        previous: state,
                        vector: vector(state.position, dx31),
                        type: "evading distant rect by bottom"
                    });
                }
                else {
                    var dx2 = goalGridAwareY({ x: dxHit.x + (dx < 0 ? dxHit.width : 0), y: dxHit.y }, goal, grid);
                    result.push({
                        position: dx2,
                        heuristic: positionHeuristic(dx2, goal),
                        cost: calcCost(state, goal, dx2, rects),
                        previous: state,
                        vector: vector(state.position, dx2),
                        type: "evading close rect by top"
                    });
                    var dx3 = goalGridAwareY({ x: dxHit.x + (dx < 0 ? dxHit.width : 0), y: dxHit.y + dxHit.height }, goal, grid);
                    result.push({
                        position: dx3,
                        heuristic: positionHeuristic(dx3, goal),
                        cost: calcCost(state, goal, dx3, rects),
                        previous: state,
                        vector: vector(state.position, dx3),
                        type: "evading close rect by bottom"
                    });
                }
            }
            else if (Math.abs(dx) > config.splitThreshold && !state.isSplit) {
                var sdx = { x: state.position.x + dx/2, y: state.position.y };
                result.push({
                    position: sdx,
                    heuristic: positionHeuristic(sdx, goal),
                    cost: calcCost(state, goal, sdx, rects),
                    previous: state,
                    vector: vector(state.position, sdx),
                    type: "moving halfway straight by x",
                    isSplit: true
                });
            }
        }

        if (Math.abs(dy) > 0) {
            var nextDy = { x: state.position.x, y: goal.y };
            var dyHit = nodeHits(nextDy, rects) || arcHits({ p1: state.position, p2: nextDy }, rects);

            result.push({
                position: nextDy,
                heuristic: positionHeuristic(nextDy, goal),
                cost: calcCost(state, goal, nextDy, rects),
                previous: state,
                vector: vector(state.position, nextDy),
                type: "moving straight by y"
            });

            if (dyHit) {
                var dy1 = goalGridAwareY({ x: state.position.x, y : dyHit.y + (dy < 0 ? dyHit.height : 0)}, goal, grid);

                if (dy1.y != state.position.y) {
                    result.push({
                        position: dy1,
                        heuristic: positionHeuristic(dy1, goal),
                        cost: calcCost(state, goal, dy1, rects),
                        previous: state,
                        vector: vector(state.position, dy1),
                        type: "closing down rect"
                    });

                    var dy21 = goalGridAwareX({x: dyHit.x, y: state.position.y}, goal, grid);
                    result.push({
                        position: dy21,
                        heuristic: positionHeuristic(dy21, goal),
                        cost: calcCost(state, goal, dy21, rects),
                        previous: state,
                        vector: vector(state.position, dy21),
                        type: "evading distant rect by left"
                    });
                    var dy31 = goalGridAwareX({x: dyHit.x + dyHit.width, y: state.position.y}, goal, grid);
                    result.push({
                        position: dy31,
                        heuristic: positionHeuristic(dy31, goal),
                        cost: calcCost(state, goal, dy31, rects),
                        previous: state,
                        vector: vector(state.position, dy31),
                        type: "evading distant rect by right"
                    });

                }
                else {

                    var dy2 = goalGridAwareX({x: dyHit.x, y: state.position.y}, goal, grid);
                    result.push({
                        position: dy2,
                        heuristic: positionHeuristic(dy2, goal),
                        cost: calcCost(state, goal, dy2, rects),
                        previous: state,
                        vector: vector(state.position, dy2),
                        type: "evading close rect by left"
                    });
                    var dy3 = goalGridAwareX({x: dyHit.x + dyHit.width, y: state.position.y}, goal, grid);
                    result.push({
                        position: dy3,
                        heuristic: positionHeuristic(dy3, goal),
                        cost: calcCost(state, goal, dy3, rects),
                        previous: state,
                        vector: vector(state.position, dy3),
                        type: "evading close rect by right"
                    });
                }
            }
            else if (Math.abs(dy) > config.splitThreshold && !state.isSplit) {
                var sdy = { x: state.position.x, y: state.position.y + dy/2};
                result.push({
                    position: sdy,
                    heuristic: positionHeuristic(sdy, goal),
                    cost: calcCost(state, goal, sdy, rects),
                    previous: state,
                    vector: vector(state.position, sdy),
                    type: "moving halfway by y",
                    isSplit: true
                });
            }
        }

        return result;
    }

    function fringePopper(fringe) {
        var min = _.sortBy(fringe, function(state) {
            return state.cost + state.heuristic;
        })[0];

        fringe.splice(fringe.indexOf(min), 1);

        return min;
    }

    function positionOnStateList(states, position) {
        return _.any(states, function(state) { return state.position.x == position.x && state.position.y == position.y; });
    }

    function graphSearch(p1, p2, rects, grid, initialVector, finalVector, statePushedCallback) {
        var closed = [];
        var fringe = [];
        var arcs = [];

        fringe.push({
            position: p1,
            heuristic: positionHeuristic(p1, p2),
            cost: 0.0,
            previous: null,
            vector: initialVector
        });

        var next;
        var success = false;

        p2 = _.extend({}, p2, { vector: finalVector });

        while (true) {
            if (fringe.length == 0) break;
            next = fringePopper(fringe);

            if (goalTest(next, p2)) {
                success = true;
                break;
            }

            if (positionOnStateList(closed, next.position))
                continue;

            closed.push(next);

            var children = config.offroad.use ? nextOffroadStates(next, p2, rects) : nextStates(next, p2, rects, grid);
            if (statePushedCallback)
                _.each(children, statePushedCallback);
            fringe = _.union(fringe, children);
        }

        if (success) {
            while (next.previous != null) {
                arcs.push({p2: next.position, p1: next.previous.position, cost: next.cost - next.previous.cost });
                next = next.previous;
            }

            arcs.reverse();

            return arcs;
        }
    }

    function goalTest(state, finalPoint) {
        return (state.position.x == finalPoint.x) && (state.position.y == finalPoint.y);
    }

    return {
        config: config,
        make: graphSearch,
        vector: vector,
        inverseVector: inverseVector
    }
});

