import {Basic} from './basic.js';
const canvas=document.querySelector('#screen'),ctx=canvas.getContext('2d');
const input=document.querySelector('#command'),transcript=document.querySelector('#transcript');
const palette=['#000000','#ffffff','#813338','#75cec8','#8e3c97','#56ac4d','#352879','#edf171','#8e5029','#553800','#c46c71','#4a4a4a','#7b7b7b','#a9ff9f','#7b71d6','#b2b2b2'];
let background='#352b79',border=palette[14],foreground=14;
let rows=Array.from({length:25},()=>Array.from({length:40},()=>({c:' ',color:14,reverse:false}))),row=0,col=0;
let mode='menu',disk=[],selected=0,menuFiles=[],pageLines=[],pageIndex=0,active=null,blink=true,inputResolve=null;
let history=[],historyIndex=0,loaded=false,fontReady=false;
const normal=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").replace(/[“”]/g,'"').replace(/[—–]/g,'-').toUpperCase();
function fresh(){return Array.from({length:40},()=>({c:' ',color:foreground,reverse:false}));}
function clear(){rows=Array.from({length:25},fresh);row=0;col=0;render();}
function lineAt(y,text,reverse=false){rows[y]=fresh();for(const [x,c] of [...normal(text).slice(0,40)].entries())rows[y][x]={c,color:foreground,reverse};}
function newline(){col=0;row++;if(row>=25){rows.shift();rows.push(fresh());row=24;}}
function print(text=''){for(const c of normal(text)){if(c==='\n'){newline();continue;}if(col>=40)newline();rows[row][col++]={c,color:foreground,reverse:false};}newline();render();}
function render(){
  if((mode==='command'||mode==='input')&&row>23){rows.shift();rows.push(fresh());row--;}
  ctx.fillStyle=border;ctx.fillRect(0,0,384,272);ctx.fillStyle=background;ctx.fillRect(32,36,320,200);
  ctx.font=fontReady?'8px C64':'8px monospace';ctx.textBaseline='top';
  for(let y=0;y<25;y++)for(let x=0;x<40;x++){const cell=rows[y][x];const px=32+x*8,py=36+y*8;
    if(cell.reverse){ctx.fillStyle=palette[cell.color];ctx.fillRect(px,py,8,8);}ctx.fillStyle=cell.reverse?background:palette[cell.color];ctx.fillText(cell.c,px,py);
  }
  if((mode==='command'||mode==='input')&&!basic.running || mode==='input'){
    const text=normal(input.value),cursor=input.selectionStart??text.length;
    const shown=text.slice(-79),offset=Math.max(0,text.length-79),base=Math.min(row,23);
    for(let n=0;n<=shown.length;n++){const x=n%40,y=base+Math.floor(n/40);if(y>24)break;ctx.fillStyle=background;ctx.fillRect(32+x*8,36+y*8,8,8);ctx.fillStyle=palette[foreground];if(n<shown.length)ctx.fillText(shown[n],32+x*8,36+y*8);if(blink&&n===cursor-offset)ctx.fillRect(32+x*8,36+y*8,8,8);}
  }
  const text=rows.map(r=>r.map(c=>c.c).join('').trimEnd()).join('\n');
  if(transcript.textContent!==text)transcript.textContent=text;
}
function ready(){mode='command';print('READY.');input.disabled=false;render();}
function wrap(text,width=38){const out=[];for(const para of normal(text).split('\n')){if(!para){out.push('');continue;}let line='';for(let word of para.split(/\s+/)){while(word.length>width){if(line){out.push(line);line='';}out.push(word.slice(0,width));word=word.slice(width);}if(line.length+word.length+1>width){out.push(line);line='';}line+=(line?' ':'')+word;}out.push(line);}return out;}
function showLinks(links=[]){const box=document.querySelector('#links');box.replaceChildren();for(const link of links){const a=document.createElement('a');a.textContent=link.title;a.href=link.url;a.target='_blank';a.rel='noopener noreferrer';box.append(a);}}
function menu(filter=''){
  basic.stop();mode='menu';selected=0;menuFiles=disk.filter(f=>!filter||normal(`${f.name} ${f.title} ${f.text??''}`).includes(normal(filter)));active=null;input.value='';showLinks();drawMenu();
}
function drawMenu(boot=false){
  clear();if(boot){lineAt(1,'    **** COMMODORE 64 BASIC V2 ****');lineAt(3,' 64K RAM SYSTEM  38911 BASIC BYTES FREE');lineAt(5,'READY.');}
  else{lineAt(1,'         PUBLIC SPACE / DISK 8');lineAt(3,'  A SMALL COMPUTER BY DONOVAN MARTINEZ');lineAt(5,'  F1 FILES  F3 HELP  ESC COMMAND LINE');}
  lineAt(7,'0 "PUBLIC SPACE     " 64 2A',true);
  const start=Math.floor(selected/11)*11;
  for(let n=start;n<Math.min(start+11,menuFiles.length);n++){const f=menuFiles[n],blocks=Math.max(1,Math.ceil((f.text??'').length/254));lineAt(9+n-start,`${String(blocks).padEnd(4)} "${f.name.padEnd(16)}" ${f.type}`,n===selected);}
  if(!menuFiles.length)lineAt(10,'  NO MATCHES. TYPE MENU TO SEE ALL.');
  lineAt(21,`${menuFiles.length} FILES.  UP/DOWN + RETURN TO OPEN.`);
  lineAt(23,'TYPE HELP, SEARCH MUSIC, OR A FILE NAME.');lineAt(24,'WEB COMPUTER / BASIC SUBSET');render();
}
function page(file){basic.stop();active=file;mode='page';pageIndex=0;pageLines=wrap(file.text??'');input.value='';showLinks(file.links??[]);drawPage();}
function drawPage(){clear();lineAt(0,` "${active.name}" ${active.type}`,true);lineAt(1,` ${pageIndex+1}/${Math.max(1,Math.ceil(pageLines.length/19))}  ${active.title}`);pageLines.slice(pageIndex*19,(pageIndex+1)*19).forEach((s,i)=>lineAt(i+3,' '+s));lineAt(23,' LEFT/RIGHT OR SPACE: PAGE   ESC: FILES');lineAt(24,active.url?' RETURN: OPEN LINK IN BROWSER':' TYPE MENU, HELP, OR ANOTHER FILE NAME');render();}
function storageRead(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function saveWorkspace(){try{localStorage.setItem('public-space.workspace',basic.list());}catch{print('?LOCAL SAVE UNAVAILABLE');}}
function programFile(text){basic.stop();basic.load(text);saveWorkspace();clear();mode='command';print(basic.list());print('TYPE RUN TO START.');ready();}
function openFile(name){const f=disk.find(f=>f.name===normal(name)||normal(f.title)===normal(name));if(!f){const saved=storageRead('public-space.programs',{});if(typeof saved[name]==='string'){programFile(saved[name]);return;}throw new Error('FILE NOT FOUND');}if(f.type==='PRG')programFile(f.text);else page(f);}
function help(){page({name:'HELP',title:'COMMAND REFERENCE',type:'TXT',text:`WELCOME TO PUBLIC SPACE\n\nThis is a working web computer with a small BASIC interpreter. It is not a hardware emulator.\n\nF1 / MENU / DIR / LS: browse files.\nArrow keys + Return: select a file.\nClick a file row or use your keyboard.\nEscape: back / stop a program.\n\nOPEN ABOUT or just ABOUT: read a file.\nLOAD "ABOUT",8: also opens a page.\nLOAD "$",8: browse the disk.\nSEARCH word: search titles and text.\nLINKS: real browser emulators.\nCLS: clear screen.\n\nBASIC\nType numbered lines, then RUN.\nLIST: see your program.\nNEW: clear the program, keep disk saves.\nA bare line number deletes that line.\n\n10 FOR I=1 TO 5\n20 PRINT "HELLO ";I\n30 NEXT I\nRUN\n\nPRINT, LET, IF/THEN, GOTO, GOSUB, RETURN, FOR/NEXT, INPUT, REM, END, CLS, POKE.\n\nSAVE NAME: save on this browser only.\nSAVES: list your local programs.\nLOAD NAME: load a saved program.\nEXPORT: download a text .bas file.\nF5: RUN. ESC / RUN-STOP: interrupt.\n\nPaste several numbered lines into the command field to enter them together.\n\nPOKE 53280,0 changes the border.\nPOKE 53281,0 changes the background.\nPOKE 646,1 changes the text color.\n\nRESET: reboot display; keep program.\nRESTORE: return to blue colors.\n\nNo 6510, SID, VIC-II, PRG or D64 binary compatibility. Only the documented BASIC subset runs here.\n\nPrograms stop after 20000 statements. There is no JavaScript eval. Your saved programs stay in this browser, not on the server. Export anything you want to keep.\n\nUse READABLE SCREEN / LINKS below for a larger text view and clickable links.`});}
const basic=new Basic({print,clear,poke(address,value){if(address===53280)border=palette[value%16];if(address===53281)background=palette[value%16];if(address===646)foreground=value%16;if(address>=1024&&address<2024){const n=address-1024;rows[Math.floor(n/40)][n%40].c=String.fromCharCode(value%128<32?value%128+64:value%128);rows[Math.floor(n/40)][n%40].reverse=value>=128;}if(address>=55296&&address<56296){const n=address-55296;rows[Math.floor(n/40)][n%40].color=value%16;}render();},input(prompt){mode='input';input.value='';print(prompt+' ?');input.focus();return new Promise(resolve=>{inputResolve=resolve;});},cancelInput(){if(inputResolve){inputResolve('');inputResolve=null;}},peek(address){if(address<0||address>65535||!Number.isInteger(address))throw new Error('ILLEGAL QUANTITY');return basic.memory[address];}});
function stop(){basic.stop();if(!basic.running){mode='command';input.value='';ready();}}
async function execute(raw){
  if(!loaded)return;
  if(inputResolve){const r=inputResolve;inputResolve=null;input.value='';mode='command';print(raw);r(raw);return;}
  if(basic.running){basic.stop();return;}
  const text=raw.trim();input.value='';if(!text){if(mode==='menu'&&menuFiles.length)openFile(menuFiles[selected].name);else if(mode==='page'&&active.url)window.open(active.url,'_blank','noopener,noreferrer');else if(mode==='page')nextPage(1);return;}
  history.push(text);historyIndex=history.length;const upper=normal(text);
  try{
    if(/^\d/.test(text)){if(mode!=='command')clear();mode='command';print(text);basic.edit(text);saveWorkspace();render();return;}
    if(/^(MENU|DIR|LS|FILES)$/.test(upper)||/^LOAD\s+"\$"(?:,8)?$/.test(upper)){menu();return;}
    if(/^(HELP|\?)$/.test(upper)){help();return;}
    if(upper.startsWith('SEARCH ')){menu(text.slice(7).trim().replace(/^"|"$/g,''));return;}
    const load=/^(?:LOAD|OPEN|CAT|TYPE)\s+(?:"([^"]+)"|([^,]+))(?:,8(?:,1)?)?$/i.exec(text);
    if(load){openFile(normal((load[1]??load[2]).trim()));return;}
    if(disk.some(f=>f.name===upper)){openFile(upper);return;}
    if(mode!=='command')clear();mode='command';print(text);
    if(upper==='RUN'){await basic.run();ready();return;}
    if(upper==='LIST'){print(basic.list()||'(EMPTY PROGRAM)');ready();return;}
    if(upper==='NEW'){basic.lines.clear();saveWorkspace();print('PROGRAM CLEARED.');ready();return;}
    if(upper==='CLS'||upper==='CLEAR'){clear();ready();return;}
    if(upper==='RESET'||upper==='RESTORE'){background='#352b79';border=palette[14];foreground=14;menu();return;}
    if(upper==='SAVES'){const saves=storageRead('public-space.programs',{});print(Object.keys(saves).join('\n')||'(NO SAVED PROGRAMS)');ready();return;}
    const save=/^SAVE\s+"?([A-Z0-9_-]{1,16})"?$/.exec(upper);
    if(save){if(disk.some(f=>f.name===save[1]))throw new Error('NAME RESERVED BY SITE DISK');const saves=storageRead('public-space.programs',{});saves[save[1]]=basic.list();try{localStorage.setItem('public-space.programs',JSON.stringify(saves));}catch{throw new Error('LOCAL STORAGE UNAVAILABLE');}print('SAVED ON THIS BROWSER.');ready();return;}
    if(upper==='EXPORT'){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([basic.list()+'\n'],{type:'text/plain'}));a.href=url;a.download='public-space.bas';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);print('BASIC SOURCE EXPORTED.');ready();return;}
    if(/^(PRINT\b|\?|LET\b|POKE\b|[A-Z][A-Z0-9]*\$?\s*=)/i.test(text)){await basic.run(text);ready();return;}
    print('?UNKNOWN COMMAND. TYPE HELP.');ready();
  }catch(error){mode='command';print('?'+error.message);ready();}
}
function nextPage(delta){if(mode!=='page')return;pageIndex=Math.max(0,Math.min(Math.ceil(pageLines.length/19)-1,pageIndex+delta));drawPage();}
function key(event){
  if(event.ctrlKey||event.metaKey||event.altKey)return;
  if(event.key==='Escape'){event.preventDefault();if(basic.running)stop();else if(mode==='page')menu();else {mode='command';clear();ready();}return;}
  if(['F1','F3','F5'].includes(event.key)){event.preventDefault();if(basic.running){stop();return;}void execute(event.key==='F1'?'MENU':event.key==='F3'?'HELP':'RUN');return;}
  if(mode==='menu'&&['ArrowUp','ArrowDown'].includes(event.key)&&!input.value){event.preventDefault();selected=(selected+(event.key==='ArrowUp'?-1:1)+menuFiles.length)%Math.max(1,menuFiles.length);drawMenu();return;}
  if(mode==='page'&&['ArrowLeft','ArrowRight','PageDown','PageUp',' '].includes(event.key)&&!input.value){event.preventDefault();nextPage(['ArrowLeft','PageUp'].includes(event.key)?-1:1);return;}
  if(event.target===canvas){
    if(event.key==='Enter'){event.preventDefault();void execute(input.value);return;}
    if(event.key.length===1||event.key==='Backspace'){event.preventDefault();if(basic.running&&!inputResolve)return;if(mode!=='command'&&mode!=='input'){clear();mode='command';ready();}input.value=event.key==='Backspace'?input.value.slice(0,-1):(input.value+event.key).slice(0,240);input.focus();render();return;}
  }
  if(event.target===input&&mode==='command'&&['ArrowUp','ArrowDown'].includes(event.key)){
    event.preventDefault();historyIndex=Math.max(0,Math.min(history.length,historyIndex+(event.key==='ArrowUp'?-1:1)));input.value=history[historyIndex]??'';render();
  }
}
canvas.addEventListener('keydown',key);input.addEventListener('keydown',key);
input.addEventListener('input',()=>{if(mode!=='command'&&mode!=='input'){clear();mode='command';ready();}render();});
input.addEventListener('keyup',render);
input.addEventListener('paste',event=>{const pasted=event.clipboardData?.getData('text');if(pasted?.includes('\n')&&!basic.running){event.preventDefault();void(async()=>{for(const line of pasted.split(/\r?\n/).slice(0,500))if(line.trim())await execute(line);})();}});
document.querySelector('#command-form').addEventListener('submit',e=>{e.preventDefault();void execute(input.value);});
canvas.addEventListener('click',event=>{const rect=canvas.getBoundingClientRect(),y=Math.floor(((event.clientY-rect.top)*272/rect.height-36)/8);if(mode==='menu'&&y>=9&&y<20){const idx=Math.floor(selected/11)*11+y-9;if(menuFiles[idx]){selected=idx;openFile(menuFiles[idx].name);return;}}input.focus();});
for(const b of document.querySelectorAll('[data-command]'))b.addEventListener('click',()=>{void execute(b.dataset.command);canvas.focus();});
document.querySelector('#stop').addEventListener('click',stop);
document.querySelector('#full').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('#machine').requestFullscreen();canvas.focus();}catch{print('?FULL SCREEN UNAVAILABLE');}});
setInterval(()=>{blink=!blink;if(mode==='command'||mode==='input')render();},500);
// Feature-detected WebMCP: exactly the same navigation and command functions.
if(document.modelContext?.registerTool){const lifetime=new AbortController();addEventListener('pagehide',()=>lifetime.abort(),{once:true});try{Promise.resolve(document.modelContext.registerTool({name:'public_space_command',title:'Use the Public Space computer',description:'Enter a command or BASIC line. SAVE stores a program on this browser; EXPORT downloads a file. Does not execute JavaScript.',inputSchema:{type:'object',properties:{command:{type:'string',maxLength:240}},required:['command'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},async execute(args){if(!args||typeof args.command!=='string'||args.command.length>240||/[\r\n]/.test(args.command))throw new Error('One command of up to 240 characters required');if(!loaded)throw new Error('Computer is still loading');if(/^INPUT\b/i.test(args.command))throw new Error('Use the visible keyboard for INPUT');await execute(args.command);return {mode,screen:transcript.textContent};}},{signal:lifetime.signal})).catch(()=>{});}catch{}}
try{
  await document.fonts.load('8px C64');fontReady=document.fonts.check('8px C64');
  const response=await fetch('disk.json');if(!response.ok)throw new Error('DISK INDEX UNAVAILABLE');disk=await response.json();
  await Promise.all(disk.map(async file=>{if(file.path){const r=await fetch(file.path);if(!r.ok)throw new Error('FILE UNAVAILABLE: '+file.name);file.text=await r.text();}}));
  const previous=localStorageSafe();if(previous)try{basic.load(previous);}catch{}
  loaded=true;menuFiles=disk;drawMenu(true);canvas.focus({preventScroll:true});
}catch(error){loaded=true;clear();print('PUBLIC SPACE');print('?'+error.message);print('RELOAD TO TRY AGAIN.');mode='command';}
function localStorageSafe(){try{return localStorage.getItem('public-space.workspace');}catch{return null;}}
