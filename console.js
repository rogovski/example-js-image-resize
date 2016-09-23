import path from 'path';
import config from './config';
import sharp from 'sharp';
import fs from 'fs';


/**
 * configure input/output directories here
 */
const readpath = 'inputdir';
const writepath = 'outputdir';
const widthThreshold = 300;

/**
 * wrap readdir in promise
 */
function getDirContents(dir) {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, function(err, res) {
      if (err){
        reject(err);
      }
      else {
        resolve(res);
      }
    });
  });
}

/**
 * zip two lists :: [a] -> [b] -> [(a,b)]
 */
function zip2(a, b) {
  var lim = Math.min(a.length,b.length);
  var acc = [];
  for(var i = 0; i < lim; i++) {
    acc.push({fst: a[i], snd: b[i]});
  }
  return acc;
}

/**
 * zip three lists :: [a] -> [b] -> [c] -> [(a,b,c)]
 */
function zip3(a, b, c) {
  var lim = Math.min(a.length,b.length,c.length);
  var acc = [];
  for(var i = 0; i < lim; i++) {
    acc.push({fst: a[i], snd: b[i], trd: c[i]});
  }
  return acc;
}


/**
 * get contents of @readpath directory
 */
function getPaths(readpath) {
  return getDirContents(readpath)
    .then((res) => {
      return zip2(res.map(r => path.join(readpath, r)), res);
    });
}


/**
 * initialize a sharp object on each file found in the source directory
 */
function initSharpList(ls) {
  return ls.map(l => sharp(l));
}

/**
 * extract info from list of sharp images
 * @param ls {[sharp]}
 */
function getMetadata(ls) {
  return Promise.all(ls.map(l => l.metadata()));
}


/**
 *
 * param imtuple :: (Sharp, SharpMeta)
 */
function coreProc(image, meta) {
  const widthLim = widthThreshold;
  if(meta.width <= widthLim) {
    return image;
  }
  const newHeight = Math.floor((widthLim * meta.height) / meta.width);
  return image.resize(widthLim, newHeight);
}


/**
 * run image resize routine
 */
getPaths(readpath).then(r => {
  let imageInPaths = r.map(item => item.fst);
  let imageNames = r.map(item => item.snd);
  let sharpList = initSharpList(imageInPaths);
  return getMetadata(sharpList).then(metaLs => {
    return zip3(sharpList, metaLs, imageNames);
  });
}).then(r => {
  let writePaths = r.map(item => path.join(writepath, item.trd));
  let procResults = r.map(item => coreProc(item.fst, item.snd));
  return Promise.all(procResults).then(ims => {
    let writeProcs = zip2(writePaths, ims).map(item => item.snd.toFile(item.fst));
    return Promise.all(writeProcs);
  });
}).then(r => console.log(r));
