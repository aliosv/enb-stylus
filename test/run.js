require('./lib/mock-require');

var fs = require('fs');
var path = require('path');
var mock = require('mock-fs');
var TestNode = require('enb/lib/test/mocks/test-node');
var FileList = require('enb/lib/file-list');
var CssTech = require('../techs/css-stylus');
var cases = mockDir(path.join(__dirname, 'cases'));
var images = mockDir(path.join(__dirname, 'images'));

// integration cases
//
//addSuite('integration', readDir('test/cases'), function(test){
//    var path = 'test/cases/' + test + '.styl'
//        , styl = readFile(path)
//        , css = readFile('test/cases/' + test + '.css')
//        , style = stylus(styl)
//            .set('filename', path)
//            .include(__dirname + '/images')
//            .include(__dirname + '/cases/import.basic')
//            .define('url', stylus.url());
//
//    if (~test.indexOf('compress')) style.set('compress', true);
//    if (~test.indexOf('include')) style.set('include css', true);
//    if (~test.indexOf('prefix.')) style.set('prefix', 'prefix-');
//    if (~test.indexOf('hoist.')) style.set('hoist atrules', true);
//
//    if (~test.indexOf('resolver')) {
//        style.set('resolve url', true);
//        style.define('url', stylus.resolver());
//    }
//
//    style.render(function(err, actual){
//        if (err) throw err;
//        actual.trim().should.equal(css);
//    });
//}, ['index']);

// converter cases

addSuite('cases', readDir('test/cases', '.styl'), function(test, done) {
    var path = 'test/cases/' + test + '.styl',
        styl = readFile(path),
        css = readFile('test/cases/' + test + '.css');

    mock({
        '/Users/blond/projects/enb-stylus/node_modules/stylus/lib/functions.styl': readFile('/Users/blond/projects/enb-stylus/node_modules/stylus/lib/functions/index.styl'),
        cases: cases,
        images: images
    });

    var node = new TestNode('cases');
    var fileList = new FileList();

    fileList.addFiles([{
        fullname: 'cases/' + test + '.styl',
        name: test + '.styl',
        suffix: 'styl'
    }]);
    node.provideTechData('?.files', fileList);

    node.runTechAndGetContent(
        CssTech, {
            includes: ['images', 'cases/import.basic'],
            comments: false,
            compress: ~test.indexOf('compress'),
            prefix: ~test.indexOf('prefix.') && 'prefix-',
            hoist: ~test.indexOf('hoist.'),
            include: ~test.indexOf('include'),
            resolve: ~test.indexOf('resolver'),
            inline: !(~test.indexOf('resolver') || ~test.indexOf('include'))
        }
    ).spread(function (source) {
            source.toString('utf-8').trim().must.eql(css);
            mock.restore();
            done()
    }).fail(function (err) {
            mock.restore();
        done(err)
    });
}, ['index']);
//
//// deps resolver cases
//
//addSuite('dependency resolver', readDir('test/deps-resolver'), function(test){
//    var path = 'test/deps-resolver/' + test + '.styl'
//        , styl = readFile(path)
//        , deps = readFile('test/deps-resolver/' + test + '.deps')
//        , style = stylus(styl).set('filename', path);
//
//    style.deps().join('\n').trim().should.equal(deps);
//});
//
//// sourcemap cases
//
//addSuite('sourcemap', readDir('test/sourcemap'), function(test){
//    var inline = ~test.indexOf('inline')
//        , path = 'test/sourcemap/' + test + '.styl'
//        , styl = readFile(path)
//        , style = stylus(styl).set('filename', path).set('sourcemap',
//            { inline: inline, sourceRoot: '/', basePath: 'test/sourcemap' })
//        , expected = readFile(path.replace('.styl', inline ? '.css' : '.map'));
//
//    style.render(function(err, css) {
//        if (err) throw err;
//        if (inline) {
//            style.sourcemap.sourcesContent.should.not.be.empty;
//            css.should.include('sourceMappingURL=data:application/json;base64,');
//        } else {
//            style.sourcemap.should.eql(JSON.parse(expected));
//        }
//    });
//});

// JS API
//
//describe('JS API', function(){
//    it('define a variable with object as hash', function(){
//        stylus('body { foo: test-obj.baz.foo.quz; bar: test-obj.bar[0].foo  }')
//            .set('compress', true)
//            .define('test-obj', {
//                bar: [{ foo: 1 }],
//                baz: {
//                    foo: { quz: 'quz' },
//                }
//            }, true).render().should.equal("body{foo:'quz';bar:1}");
//    });
//
//    it('define a variable with object as list', function(){
//        stylus('body { foo: test-obj  }')
//            .set('compress', true)
//            .define('test-obj', {
//                baz: {
//                    foo: { quz: 'quz' }
//                }
//            }).render().should.equal("body{foo:baz foo quz 'quz'}");
//    });
//
//    it('use variable from options object', function(){
//        stylus
//            .render(
//            'body { foo: bar  }',
//            {
//                compress: true,
//                globals: {
//                    'bar': 'baz'
//                }
//            }
//        ).should.equal("body{foo:baz}");
//    });
//
//    it('use functions from options object', function(){
//        stylus
//            .render(
//            'body { foo: add(4, 3); bar: something() }',
//            {
//                compress: true,
//                functions: {
//                    add: function(a, b) {
//                        return a.operate('+', b);
//                    },
//                    something: function() {
//                        return new stylus.nodes.Ident('foobar');
//                    }
//                }
//            }
//        ).should.equal("body{foo:7;bar:foobar}");
//    });
//
//    it('use plugin(s) from options object', function(){
//        var plugin = function(key, value) {
//            return function(style) {
//                style.define(key, new stylus.nodes.Literal(value));
//            }
//        };
//
//        stylus('body { foo: bar  }', {
//            compress: true,
//            use: plugin('bar', 'baz')
//        }).render().should.equal('body{foo:baz}');
//
//        stylus('body { foo: bar; foo: qux  }', {
//            compress: true,
//            use: [plugin('bar', 'baz'), plugin('qux', 'fred')]
//        }).render().should.equal('body{foo:baz;foo:fred}');
//    });
//
//    it('import cloning with cache', function(){
//        var path = __dirname + '/cases/import.basic/'
//            , styl = readFile(path + 'clone.styl')
//            , css = 'body{background:linear-gradient(from bottom,#f00,#00f)}';
//
//        stylus(styl, { compress: true })
//            .render().should.equal(css);
//
//        stylus('@import "clone"', { compress: true, paths: [path] })
//            .render().should.equal(css);
//    });
//
//    it('import cloning with cache #2', function(){
//        var path = __dirname + '/cases/import.basic/'
//            , styl = fs.readFileSync(path + 'clone2.styl', 'utf-8').replace(/\r/g, '')
//            , css = 'body{color:#f00}body{color:#00f}body{color:#00f}body{color:#00f}body{color:#008000}';
//
//        stylus(styl, { compress: true })
//            .render().should.equal(css);
//
//        stylus('@import "clone2"', { compress: true, paths: [path] })
//            .render().should.equal(css);
//    });
//});

// helper functions

function addSuite(desc, cases, fn, ignore) {
    describe(desc, function(){
        cases.forEach(function(test){
            var name = normalizeName(test);

            if (ignore && ~ignore.indexOf(name)) return;
            it(name, function (done) {
                fn(test, done);
            });
        });
    });
}

function readDir(dir, ext){
    ext = ext || '.styl';
    return fs.readdirSync(dir).filter(function(file){
        return ~file.indexOf(ext);
    }).map(function(file){
        return file.replace(ext, '');
    });
}

function readFile(filename){
    var ext = path.extname(filename),
        basename = path.basename(filename);

    if (basename === 'gif' || ext === '.gif' || ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.svg') {
        return fs.readFileSync(filename);
    }

    return normalizeContent(fs.readFileSync(filename, 'utf-8'));
}

function normalizeName(name){
    return name.replace(/[-.]/g, ' ');
}

function normalizeContent(str){
    return str.replace(/\r/g, '').trim();
}

function mockDir(dir) {
    var obj = {};

    fs.readdirSync(dir).forEach(function (basename) {
        var filename = path.join(dir, basename);
        var stat = fs.statSync(filename);

        if (stat.isDirectory()) {
            process(obj, dir, basename);
        } else {
            obj[basename] = readFile(filename);
        }
    });

    function process(obj, root, dir) {
        var dirname = dir ? path.join(root, dir) : root;
        var basename = dir || root;
        var od = obj[basename] = {};

        fs.readdirSync(dirname).forEach(function (basename) {
            var filename = path.join(dirname, basename);
            var stat = fs.statSync(filename);

            if (stat.isDirectory()) {
                process(od, dirname, basename);
            } else {
                od[basename] = readFile(filename);
            }
        });
    }

    return obj;
}
