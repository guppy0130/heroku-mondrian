const gm = require('gm');
const express = require('express');
const compress = require('compression');

const app = express();
const port = process.env.PORT || 3000;

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
    levels: 3,
    ext: 'png'
};

const clean = {
    number: (input, o) => {
        return (input > 0 ? input : o);
    },
    bool: (input) => {
        if (input === undefined) {
            return settings.discardRatio;
        }
        if (input.length > 3) {
            input = input.toLowerCase();
        }
        if (input === 'true' || input === 't') {
            return true;
        } else if (input === 'false' || input === 'f') {
            return false;
        } else {
            return settings.discardRatio;
        }
    },
    ext: (input) => {
        if (input && input.match(/(jpg|png|webp)/gi)) {
            return input;
        }
        return settings.ext;
    }
};

app.use(compress());
app.set('view engine', 'hbs');

app
    .get('/', (req, res) => {
        res.render('index', {
            port: port
        });
    })
    .get('/api/:width?/:height?/:levels?/:wRatio?/:hRatio?/:discardRatio?.:ext?', (req, res) => {
        let containerTree, graphic;
        let args = {
            width: clean.number(req.params.width, settings.width),
            height: clean.number(req.params.height, settings.height),
            levels: clean.number(req.params.levels, settings.levels),
            wRatio: clean.number(req.params.wRatio, settings.wRatio),
            hRatio: clean.number(req.params.hRatio, settings.hRatio),
            discardRatio: clean.bool(req.params.discardRatio),
            ext: clean.ext(req.params.ext)
        };

        try {
            containerTree = splitContainer(new Container(0, 0, args.width, args.height), args.levels, args);
            graphic = gm(args.width, args.height, settings.colors.white).quality(100).stroke(settings.colors.black, 3);

            containerTree.paint(graphic);

            graphic.stream(args.ext, (err, stdout) => {
                if (err) {
                    console.log(err);
                }
                console.log('written image');
                res.set('Content-Type', `image/${args.ext.toLowerCase()}`);
                stdout.pipe(res);
            });
        } catch (err) {
            if (err == 'RangeError: Maximum call stack size exceeded') {
                res.status(400).send('Maximum call stack size exceeded. Reduce argument values.');
            } else {
                res.status(400).send(`We\re not sure what the error was. Please contact the developer with this stacktrace.\n${err}`);
            }
        }
    })
    .listen(port, () => {
        console.log(`listening on port ${port}`);
    });

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

const splitContainer = (parent, iterations, args) => {
    let root = new Tree(parent);
    if (iterations !== 0) {
        let splits = split(parent, args);
        root.left = splitContainer(splits[0], iterations - 1, args);
        root.right = splitContainer(splits[1], iterations - 1, args);
    }
    return root;
};

const split = (container, args) => {
    let c1, c2;

    if (Math.random() >= 0.5) {
        c1 = new Container(container.x, container.y, random.value(1, container.w), container.h);
        c2 = new Container(container.x + c1.w, container.y, container.w - c1.w, container.h);
        if (args.discardRatio) {
            let r1 = c1.w / c1.h;
            let r2 = c2.w / c2.h;
            if (r1 < args.wRatio || r2 < args.wRatio) {
                return split(container, args);
            }
        }
    } else {
        c1 = new Container(container.x, container.y, container.w, random.value(1, container.h));
        c2 = new Container(container.x, container.y + c1.h, container.w, container.h - c1.h);
        if (args.discardRatio) {
            let r1 = c1.h / c1.w;
            let r2 = c2.h / c2.w;
            if (r1 < args.hRatio || r2 < args.hRatio) {
                return split(container, args);
            }
        }
    }
    return [c1, c2];
};
