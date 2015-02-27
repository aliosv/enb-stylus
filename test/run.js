require('./lib/mock-require');

var fs = require('fs');
var path = require('path');
var mock = require('mock-fs');
var TestNode = require('enb/lib/test/mocks/test-node');
var FileList = require('enb/lib/file-list');
var CssTech = require('../techs/css-stylus');
var cases = mockDir(path.join(__dirname, 'cases'));
var images = mockDir(path.join(__dirname, 'images'));

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
