/* Public Space BASIC: an intentionally small interpreter, not JavaScript eval.
 * New implementation for this project. See docs/BASIC.md for compatibility.
 */
export class BasicError extends Error {}
export function splitOutside(text, separators=':') {
  let quoted=false,depth=0,parts=[],start=0;
  for(let i=0;i<text.length;i++){
    const c=text[i];if(c==='"')quoted=!quoted;
    if(!quoted){if(c==='(')depth++;if(c===')')depth--;}
    if(!quoted&&depth===0&&separators.includes(c)){parts.push(text.slice(start,i));start=i+1;}
  }
  parts.push(text.slice(start));return parts;
}
function tokenize(source){
  const result=[];let rest=source.trim();
  while(rest){
    const m=/^(\d*\.\d+(?:E[+-]?\d+)?|\d+(?:\.\d*)?(?:E[+-]?\d+)?|"[^"]*"|[A-Z][A-Z0-9]*\$?|<>|<=|>=|[+\-*/^=<>(),])/i.exec(rest);
    if(!m)throw new BasicError('SYNTAX ERROR');
    result.push(m[0]);rest=rest.slice(m[0].length).trimStart();
    if(result.length>256)throw new BasicError('FORMULA TOO COMPLEX');
  }return result;
}
export class Basic {
  constructor(io={}){this.io=io;this.lines=new Map();this.vars=new Map();this.memory=new Uint8Array(65536);this.running=false;this.cancelled=false;this.pending='';}
  edit(source){
    const m=/^\s*(\d+)\s*(.*)$/.exec(source);if(!m)throw new BasicError('LINE NUMBER REQUIRED');
    const n=Number(m[1]);if(n<0||n>63999||m[2].length>240)throw new BasicError('ILLEGAL QUANTITY');
    if(m[2])this.lines.set(n,m[2]);else this.lines.delete(n);
    if(this.lines.size>500){this.lines.delete(n);throw new BasicError('PROGRAM TOO LARGE');}
  }
  load(text){const previous=this.lines;this.lines=new Map();try{for(const l of text.split(/\r?\n/))if(l.trim())this.edit(l);}catch(e){this.lines=previous;throw e;}}
  list(){return [...this.lines].sort((a,b)=>a[0]-b[0]).map(([n,s])=>`${n} ${s}`).join('\n');}
  value(name){return this.vars.get(name.toUpperCase())??(name.endsWith('$')?'':0);}
  assign(name,value){name=name.toUpperCase();if(name.endsWith('$')!== (typeof value==='string'))throw new BasicError('TYPE MISMATCH');this.vars.set(name,value);}
  expression(source){
    const tokens=tokenize(source);let i=0;
    const precedence={'OR':1,'AND':2,'=':3,'<>':3,'<':3,'>':3,'<=':3,'>=':3,'+':4,'-':4,'*':5,'/':5,'^':6};
    const numeric=v=>{if(typeof v!=='number'||!Number.isFinite(v))throw new BasicError('TYPE MISMATCH');return v;};
    const functions={INT:x=>Math.floor(numeric(x)),ABS:x=>Math.abs(numeric(x)),SIN:x=>Math.sin(numeric(x)),COS:x=>Math.cos(numeric(x)),SQR:x=>Math.sqrt(numeric(x)),RND:()=>Math.random(),LEN:x=>String(x).length,'CHR$':x=>String.fromCharCode(numeric(x)&255),'STR$':x=>String(numeric(x)),VAL:x=>Number.parseFloat(String(x))||0,PEEK:x=>this.io.peek?.(numeric(x))??this.memory[numeric(x)&65535]};
    function atom(){
      const t=tokens[i++];if(t===undefined)throw new BasicError('SYNTAX ERROR');
      if(t==='-'||t==='+'){const v=numeric(parse(6));return t==='-'?-v:v;}
      if(t.toUpperCase()==='NOT')return ~numeric(parse(3));
      if(t==='('){const v=parse(0);if(tokens[i++]!==')')throw new BasicError('SYNTAX ERROR');return v;}
      if(t.startsWith('"'))return t.slice(1,-1);
      if(/^\d|^\./.test(t))return Number(t);
      if(/^[A-Z]/i.test(t)){
        const name=t.toUpperCase();
        if(tokens[i]==='('){i++;const v=parse(0);if(tokens[i++]!==')'||!functions[name])throw new BasicError('UNDEFINED FUNCTION');return functions[name](v);}
        return self.value(name);
      }throw new BasicError('SYNTAX ERROR');
    }
    function parse(min){
      let left=atom();
      while(i<tokens.length){const op=tokens[i].toUpperCase(),p=precedence[op];if(p===undefined||p<min)break;i++;const right=parse(p+(op==='^'?0:1));
        if(['=','<>','<','>','<=','>='].includes(op)){
          if(typeof left!==typeof right)throw new BasicError('TYPE MISMATCH');
          const ok=op==='='?left===right:op==='<>'?left!==right:op==='<'?left<right:op==='>'?left>right:op==='<='?left<=right:left>=right;left=ok?-1:0;
        }else if(op==='+'&&typeof left==='string'&&typeof right==='string')left+=right;
        else{const a=numeric(left),b=numeric(right);if(op==='/'&&b===0)throw new BasicError('DIVISION BY ZERO');left=op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:op==='/'?a/b:op==='^'?a**b:op==='AND'?a&b:a|b;}
      }return left;
    }
    const self=this;const result=parse(0);if(i!==tokens.length)throw new BasicError('SYNTAX ERROR');
    if(typeof result==='number'&&!Number.isFinite(result))throw new BasicError('ILLEGAL QUANTITY');return result;
  }
  stop(){this.cancelled=true;this.io.cancelInput?.();}
  print(source){
    if(!source.trim()){this.io.print?.(this.pending);this.pending='';return;}
    let quoted=false,depth=0,start=0;
    for(let i=0;i<=source.length;i++){
      const c=source[i];if(c==='"')quoted=!quoted;if(!quoted){if(c==='(')depth++;if(c===')')depth--;}
      if(i===source.length||(!quoted&&!depth&&(c===';'||c===','))){
        const expr=source.slice(start,i).trim();if(expr){const value=this.expression(expr);if(typeof value==='string'&&value.includes('\x93')){this.io.clear?.();this.pending='';}this.pending+=String(value).replace(/\x93/g,'');}
        if(c===',')this.pending+=' '.repeat(10-this.pending.length%10);start=i+1;
      }
    }
    if(!/[;,]\s*$/.test(source)){this.io.print?.(this.pending);this.pending='';}
  }
  async run(immediate=null){
    if(this.running)throw new BasicError('ALREADY RUNNING');
    this.running=true;this.cancelled=false;this.pending='';
    const statements=[];for(const [line,text] of [...this.lines].sort((a,b)=>a[0]-b[0])){
      // IF and REM own the rest of their physical line, including colons.
      const parts=splitOutside(text);for(let n=0;n<parts.length;n++){let source=parts[n].trim();if(/^(IF\b|REM\b)/i.test(source)){source=parts.slice(n).join(':');n=parts.length;}statements.push({line,source});}
    }
    if(immediate!==null){statements.length=0;for(const source of splitOutside(immediate))statements.push({line:0,source});}
    const locations=new Map();statements.forEach((s,i)=>{if(!locations.has(s.line))locations.set(s.line,i);});
    let pc=0,steps=0;const loops=[],stack=[];const jump=n=>{if(!locations.has(n))throw new BasicError('UNDEFINED STATEMENT');pc=locations.get(n);};
    const number=expr=>{const v=this.expression(expr);if(typeof v!=='number')throw new BasicError('TYPE MISMATCH');return v;};
    const execute=async source=>{
      source=source.trim();let m;
      if(!source||/^REM(?:\s|$)/i.test(source))return;
      if((m=/^(?:PRINT\b|\?)(.*)$/i.exec(source))){this.print(m[1]);return;}
      if(/^(END|STOP)$/.test(source.toUpperCase())){pc=statements.length;return;}
      if(/^(CLS|CLEAR)$/.test(source.toUpperCase())){this.io.clear?.();return;}
      if((m=/^GOTO\s*(\d+)$/i.exec(source))){jump(Number(m[1]));return;}
      if((m=/^GOSUB\s*(\d+)$/i.exec(source))){if(stack.length>=100)throw new BasicError('OUT OF MEMORY');stack.push(pc);jump(Number(m[1]));return;}
      if(/^RETURN$/i.test(source)){if(!stack.length)throw new BasicError('RETURN WITHOUT GOSUB');pc=stack.pop();return;}
      if((m=/^IF\s+(.+?)\s+THEN\s+(.+)$/i.exec(source))){if(number(m[1])){if(/^\d+$/.test(m[2].trim()))jump(Number(m[2]));else for(const part of splitOutside(m[2]))await execute(part);}return;}
      if((m=/^FOR\s+([A-Z][A-Z0-9]*)\s*=\s*(.+?)\s+TO\s+(.+?)(?:\s+STEP\s+(.+))?$/i.exec(source))){
        const name=m[1].toUpperCase(),start=number(m[2]),end=number(m[3]),step=number(m[4]??'1');if(step===0)throw new BasicError('ILLEGAL QUANTITY');this.assign(name,start);
        if(step>0?start>end:start<end){let depth=1;while(pc<statements.length&&depth){const s=statements[pc++].source;if(/^FOR\b/i.test(s))depth++;if(/^NEXT\b/i.test(s))depth--;}if(depth)throw new BasicError('FOR WITHOUT NEXT');}
        else{if(loops.length>=100)throw new BasicError('OUT OF MEMORY');loops.push({name,end,step,pc});}return;
      }
      if((m=/^NEXT(?:\s+([A-Z][A-Z0-9]*))?$/i.exec(source))){const l=loops.at(-1);if(!l||(m[1]&&l.name!==m[1].toUpperCase()))throw new BasicError('NEXT WITHOUT FOR');const v=this.value(l.name)+l.step;this.assign(l.name,v);if(l.step>0?v<=l.end:v>=l.end)pc=l.pc;else loops.pop();return;}
      if((m=/^INPUT\s+(?:"([^"]*)"\s*;\s*)?([A-Z][A-Z0-9]*\$?)$/i.exec(source))){if(!this.io.input)throw new BasicError('INPUT UNAVAILABLE');const answer=await this.io.input(m[1]??'?');if(this.cancelled)return;const v=m[2].endsWith('$')?answer:Number(answer);if(typeof v==='number'&&(!answer.trim()||!Number.isFinite(v)))throw new BasicError('NOT A NUMBER');this.assign(m[2],v);return;}
      if((m=/^POKE\s+(.+)$/i.exec(source))){const args=splitOutside(m[1],',');if(args.length!==2)throw new BasicError('SYNTAX ERROR');const address=number(args[0]),value=number(args[1]);if(!Number.isInteger(address)||address<0||address>65535||!Number.isInteger(value)||value<0||value>255)throw new BasicError('ILLEGAL QUANTITY');this.memory[address]=value;this.io.poke?.(address,value);return;}
      if((m=/^(?:LET\s+)?([A-Z][A-Z0-9]*\$?)\s*=\s*(.+)$/i.exec(source))){this.assign(m[1],this.expression(m[2]));return;}
      throw new BasicError('SYNTAX ERROR');
    };
    let current=0;
    try{
      if(immediate===null)this.vars.clear();
      while(pc<statements.length&&!this.cancelled){if(++steps>20000)throw new BasicError('STEP LIMIT (20000)');const s=statements[pc++];current=s.line;await execute(s.source);if(steps%64===0)await new Promise(r=>setTimeout(r,0));}
      if(this.pending){this.io.print?.(this.pending);this.pending='';}
      if(this.cancelled)this.io.print?.(`BREAK${current?' IN '+current:''}`);
      return {steps,stopped:this.cancelled};
    }catch(error){throw new BasicError(`${error.message}${current?' IN '+current:''}`);}
    finally{this.running=false;}
  }
}
