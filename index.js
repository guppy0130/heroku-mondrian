const fs = require('fs');
const gm = require('gm').subClass({imageMagick: true});
const express = require('express');
const compress = require('compression');

const app = express();
const port = process.env.PORT || 3000;

app
    .get('/', (req, res) => {
        res.send('hello world');
    })
    .get('/api', (req, res) => {
        let containerTree, graphic;
        try {
            containerTree = splitContainer(new Container(0, 0, settings.width, settings.height), settings.levels);
            graphic = gm(settings.width, settings.height, settings.colors.white);
            console.log(gm(settings.width, settings.height, settings.colors.white).fill(settings.colors.blue).drawRectangle(0, 0, 30, 50));
            containerTree.paint(graphic);
            console.log(graphic);
            graphic.stream((err, stdout) => {
                stdout.pipe(res);
            });
        } catch (err) {
            console.log(err);
        }
    })
    .listen(port, () => {
        console.log(`listening on port ${port}`);
    });

const settings = {
    colors: {
        gray: '#cfd0cc',
        white: '#fff',
        red: '#bc452e',
        yellow: '#e0bb50',
        blue: '#1f4070',
        black: '#172119'
    },
    discardRatio: true,
    wRatio: 0.45,
    hRatio: 0.45,
    width: 200,
    height: 300,
    levels: 3
};

const Tree = function(leaf) {
    // a basic tree
    this.leaf = leaf;
    this.left = undefined;
    this.right = undefined;
};

Tree.prototype.paint = function(graphic) {
    // access parts of the tree and paint recursively downwards
    this.leaf.paint(graphic);
    if (this.left !== undefined) {
        this.left.paint(graphic);
    }
    if (this.right !== undefined) {
        this.right.paint(graphic);
    }
};

const Container = function(x, y, w, h) {
    // a rectangle. this will be what will be painted
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.color = random.color();
};

Container.prototype.paint = function(graphic) {
    // will make a call to imagemagick eventually
    graphic.out('-fill', `${this.color}`, '-draw', `rectangle ${this.x},${this.y} ${this.x + this.w},${this.y + this.h}`);
};

// utility functions dealing with randomness
const random = {
    // gets a random value >= min and < max
    value: (min, max) => {
        return Math.floor(Math.random() * (max - min) + min);
    },
    // gets a random color from colors
    color: () => {
        return Object.values(settings.colors)[random.value(0, Object.keys(settings.colors).length)];
    }
};

const splitContainer = (parent, iterations) => {
    let root = new Tree(parent);
    if (iterations !== 0) {
        let splits = split(parent);
        root.left = splitContainer(splits[0], iterations - 1);
        root.right = splitContainer(splits[1], iterations - 1);
    }
    return root;
};

const split = (container) => {
    let c1, c2;

    if (Math.random() >= 0.5) {
        c1 = new Container(container.x, container.y, random.value(1, container.w), container.h);
        c2 = new Container(container.x + c1.w, container.y, container.w - c1.w, container.h);
        if (settings.discardRatio) {
            let r1 = c1.w / c1.h;
            let r2 = c2.w / c2.h;
            if (r1 < settings.wRatio || r2 < settings.wRatio) {
                return split(container);
            }
        }
    } else {
        c1 = new Container(container.x, container.y, container.w, random.value(1, container.h));
        c2 = new Container(container.x, container.y + c1.h, container.w, container.h - c1.h);
        if (settings.discardRatio) {
            let r1 = c1.h / c1.w;
            let r2 = c2.h / c2.w;
            if (r1 < settings.hRatio || r2 < settings.hRatio) {
                return split(container);
            }
        }
    }
    return [c1, c2];
};
