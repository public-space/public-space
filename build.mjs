// Only generates the plain-text/JSON feed. The website itself is buildless.
import {readFile,writeFile,mkdir,stat,readdir,unlink} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
const root=resolve('dist');const files=JSON.parse(await readFile('dist/disk.json','utf8'));const names=new Set();
await mkdir('dist/feed',{recursive:true});const catalog=[];let index='PUBLIC SPACE\r\nDONOVAN MARTINEZ\r\n\r\n';
for(const file of files){
  if(!/^[A-Z0-9 _-]{1,16}$/.test(file.name)||names.has(file.name))throw new Error('Invalid/duplicate disk name: '+file.name);names.add(file.name);
  if(!['SEQ','PRG','URL'].includes(file.type))throw new Error('Unknown type');
  let text=file.text??'';
  if(file.path){const path=resolve(root,file.path);if(!path.startsWith(root+sep))throw new Error('Path outside dist');text=await readFile(path,'utf8');}
  if(file.url&&!/^https:\/\//.test(file.url))throw new Error('External URLs must use HTTPS');
  for(const link of file.links??[])if(!/^https:\/\//.test(link.url))throw new Error('Link must use HTTPS');
  const id=file.name.toLowerCase().replace(/ /g,'-');
  const plain=text.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x09\x0a\x0d\x20-\x7e]/g,'?').replace(/\r?\n/g,'\r\n');
  await writeFile(`dist/feed/${id}.txt`,plain+(file.url?'\r\n'+file.url+'\r\n':''));
  index+=`${file.name} - ${file.title}\r\n${id}.txt\r\n\r\n`;
  catalog.push({name:file.name,title:file.title,type:file.type,path:`${id}.txt`});
}
await writeFile('dist/feed/index.txt',index);await writeFile('dist/feed/catalog.json',JSON.stringify(catalog,null,2)+'\n');
// Remove generated copies of pages removed from the disk manifest.
const keep=new Set(['index.txt','catalog.json',...catalog.map(file=>file.path)]);
for(const name of await readdir('dist/feed'))if(!keep.has(name)&&name.endsWith('.txt'))await unlink(`dist/feed/${name}`);
await stat('dist/assets/C64_Pro_Mono-STYLE.woff2');
console.log(`Validated ${files.length} disk files and generated the plain-text feed.`);
