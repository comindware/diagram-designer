define(['d3'],  function (d3) {
    'use strict';

    d3.selection.prototype.bringToFront = function() {
        return this.each(function(){
            this.parentNode.appendChild(this);
        });
    };

    var d3DesignerHelpers = {};

    d3DesignerHelpers.getNewId = function () {
        var randomValues = new Uint8Array(36);
        crypto.getRandomValues(randomValues);
        var index = 0;

        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (randomValues[index]/16) | 0;
            var v = c === 'x' ? r : (r & 0x3 | 0x8);
            index ++;
            return v.toString(16);
        });
    };

    d3DesignerHelpers.getPointsOfPath = function (path) {
        var segments = path.pathSegList,
            segCount = segments.numberOfItems,
            arr = [];

        for (var i = 0; i < segCount; i++) {
            var seg = segments.getItem(i);
            arr.push({x: seg.x, y: seg.y});
        }

        return arr;
    };

    d3DesignerHelpers.LinkedDistance = 20;

    d3DesignerHelpers.getDistance = function (x1, y1, x2, y2) {
        return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
    };

    d3DesignerHelpers.getPathPoints = function (d) {
        return (d3.svg.line()
            .x(function (v) {
                return v.x;
            })
            .y(function (v) {
                return v.y;
            })
            (d));
    };

    d3DesignerHelpers.selectConnector = function (con) {
        d3.selectAll('.selectedConnector')
            .attr('fill', '#fff')
            .style({'display': 'block'})
            .classed('selectedConnector', false);

        d3.select(con)
            .classed('selectedConnector', true)
            .attr('fill', '#64aad0');
    };

    d3DesignerHelpers.unselectConnector = function (con) {
        setTimeout(function () {
            d3.select(con)
                .attr('fill', '#fff')
                .classed('selectedConnector', false);
        }, 250);
    };

    d3DesignerHelpers.getTranslation = function(position) {
        var effectivePoint = this.getPointFromParameter(position);
        return 'translate(' + effectivePoint.x + ',' + effectivePoint.y + ')';
    };

    d3DesignerHelpers.getTranslationAttribute = function(position) {
        return {
            'transform': d3DesignerHelpers.getTranslation(position)
        };
    };

    d3DesignerHelpers.applyTranslation = function (d3Obj, position) {
        d3Obj.attr(d3DesignerHelpers.getTranslationAttribute(position));
    };

    d3DesignerHelpers.appendSimpleGroup = function(container, attr) {
        var newG = container.append("g").classed({ 'no-select': true });
        attr && newG.attr(attr);
        return newG;
    };

    d3DesignerHelpers.appendTranslatedGroup = function(container, position, attr) {
        var newG = d3DesignerHelpers.appendSimpleGroup(container, attr);
        newG.attr(d3DesignerHelpers.getTranslationAttribute(position));
        return newG;
    };

    d3DesignerHelpers.regularizeRect = function(rect) {
        return {
            x: rect.width >= 0 ? rect.x : (rect.x + rect.width),
            y: rect.height >= 0 ? rect.y : (rect.y + rect.height),
            width: Math.abs(rect.width),
            height: Math.abs(rect.height)
        }
    };

    d3DesignerHelpers.doRectsIntersect = function(r1, r2) {
        return !(r2.x > r1.x + r1.width ||
            r2.x + r2.width < r1.x ||
            r2.y > r1.y + r1.height ||
            r2.y + r2.height < r1.y);
    };

    d3DesignerHelpers.doesRectContains = function (rect, point) {
        return point.x > rect.x && point.x < rect.x + rect.width &&
               point.y > rect.y && point.y < rect.y + rect.height;
    };

    d3DesignerHelpers.sumPoints = function(p1, p2) {
        var result = { x: 0, y: 0 };
        _.each(arguments, function(arg) {
            d3DesignerHelpers.transformPoint(result, arg);
        });
        return _.extend({}, p1, result);
    };

    d3DesignerHelpers.getVerticalAxis = function(rect) {
        return {
            x1: rect.x + rect.width/2,
            x2: rect.x + rect.width/2,
            y1: rect.y,
            y2: rect.y + rect.height
        }
    };

    d3DesignerHelpers.getHorizontalAxis = function(rect) {
        return {
            x1: rect.x,
            x2: rect.x + rect.width,
            y1: rect.y + rect.height/2,
            y2: rect.y + rect.height/2
        }
    };

    var getPointParam = d3DesignerHelpers.getPointFromParameter = function(paramValue, defaultValue) {
        if (_.isArray(paramValue))
            return {
                x: paramValue[0],
                y: paramValue[1]
            };

        var effectiveDefault = defaultValue ? getPointParam(defaultValue) : undefined;

        return paramValue || effectiveDefault;
    };

    d3DesignerHelpers.negativeUnitVector = [-1, -1];
    d3DesignerHelpers.unitVector = [1, 1];
    d3DesignerHelpers.nullVector = [0, 0];

    d3DesignerHelpers.maxVector = [Number.MAX_VALUE, Number.MAX_VALUE];
    d3DesignerHelpers.minVector = [-Number.MAX_VALUE, -Number.MAX_VALUE];


    d3DesignerHelpers.getTransformedPoint = function(point, add, multiply) {
        var pPoint = getPointParam(point);
        var pAdd = getPointParam(add, d3DesignerHelpers.nullVector);
        var pMultiply = getPointParam(multiply, d3DesignerHelpers.unitVector);

        return {
            x: pPoint.x + pAdd.x * pMultiply.x,
            y: pPoint.y + pAdd.y * pMultiply.y
        };
    };

    d3DesignerHelpers.substractPoint = function(p1, p2) {
        var pp1 = getPointParam(p1);
        var pp2 = getPointParam(p2);

        return d3DesignerHelpers.getTransformedPoint(pp1, pp2, d3DesignerHelpers.negativeUnitVector);
    };

    d3DesignerHelpers.getReciprocalDistance = function(points1, points2) {
        var mix = _.map(points1, function(p1) {
            return _.map(points2, (function(p2) {
                return {
                    p1: p1,
                    p2: p2,
                    distance: d3DesignerHelpers.getDistance(p1.x, p1.y, p2.x, p2.y)
                }
            }));
        });

        return _.flatten(mix);
    };

    d3DesignerHelpers.getDistances = function(points, targetPoint) {
        return _.map(points, function(x) {
            return {
                c: x,
                distance: d3DesignerHelpers.getDistance(x.x, x.y, targetPoint.x, targetPoint.y)
            }
        });
    };

    d3DesignerHelpers.transformPoint = function(point, add, multiply) {
        d3DesignerHelpers.updatePoint(
            point,
            d3DesignerHelpers.getTransformedPoint(point, add, multiply));
    };

    d3DesignerHelpers.updatePoint = function(point, setParam, xKey, yKey) {
        var effectiveXKey = xKey || "x";
        var effectiveYKey = yKey || "y";

        var param = getPointParam(setParam);

        var extender = {};
        extender[effectiveXKey] = param.x;
        extender[effectiveYKey] = param.y;

        return _.extend(point, extender);
    };

    d3DesignerHelpers.isZeroPoint = function(point) {
        return Math.abs(point.x) == 0 && Math.abs(point.y) == 0;
    };

    d3DesignerHelpers.multiplyPoint = function(point, multiplier) {
        if (multiplier.x && multiplier.y)
            d3DesignerHelpers.updatePoint(point, { x: point.x * multiplier.x, y: point.y * multiplier.y });
        else
            d3DesignerHelpers.updatePoint(point, { x: point.x * multiplier, y: point.y * multiplier });
    };

    d3DesignerHelpers.getMultipledPoint = function(point, multipler) {
        var p =  _.extend({}, point);
        d3DesignerHelpers.multiplyPoint(p, getPointParam(multipler));
        return p;
    };

    d3DesignerHelpers.getRebasedPoint = function(originalPoint, newBase) {
        var originalLength = d3DesignerHelpers.getDistance(originalPoint.x, originalPoint.y, 0, 0);
        var scale = newBase / originalLength;
        return d3DesignerHelpers.getMultipledPoint(originalPoint, scale);
    };

    d3DesignerHelpers.distance = function(p1, p2) {
        var pp1 = getPointParam(p1);
        var pp2 = getPointParam(p2);
        return d3DesignerHelpers.getDistance(pp1.x, pp1.y, pp2.x, pp2.y);
    };

    d3DesignerHelpers.getDebouncedHandler = function(fn, wait, context, stopPropagation){
        var that = this;
        var fnEffective = context ? fn.bind(context) : fn;
        var debounced = _.debounce(fnEffective, wait);

        return function() {
            var eventArg = d3.event;
            if (stopPropagation)
                eventArg.stopPropagation();
            debounced.apply(that, [eventArg]);
        };
    };

    d3DesignerHelpers.getGrownRect = function(rect, growthVector) {
        return {
            x: rect.x - growthVector.x,
            y: rect.y - growthVector.y,
            width: rect.width + growthVector.x*2,
            height: rect.height + growthVector.y*2
        }
    };

    return d3DesignerHelpers;
});