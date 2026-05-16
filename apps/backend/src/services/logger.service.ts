import fs from 'fs'

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR"

export const logger = {
    debug(...args: any[]) {
        doLog('DEBUG', ...args)
    },
    info(...args: any[]) {
        doLog('INFO', ...args)
    },
    warn(...args: any[]) {
        doLog('WARN', ...args)
    },
    error(...args: any[]) {
        doLog('ERROR', ...args)
    }
}


const logsDir = './logs'
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir)
}

//define the time format
function getTime() {
    let now = new Date()
    return now.toLocaleString('he')
}

function isError(e: any) {
    return e instanceof Error
}

function doLog(level: LogLevel, ...args: any[]) {

	const strs = args.map(arg => {
		if (typeof arg === 'string') return arg
		if (arg instanceof Error) return arg.stack || `${arg.name}: ${arg.message}`
		
		return JSON.stringify(arg)
	})
	
    var line = strs.join(' | ')
    line = `${getTime()} - ${level} - ${line}\n`
	
	console.log(line)
	
    fs.appendFile('./logs/backend.log', line, (err) =>{
        if (err) console.log('FATAL: cannot write to log file')
    })
}