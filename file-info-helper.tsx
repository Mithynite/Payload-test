
export const calculateMaxFileSize = (units:string, max:number) => {
    if(units === "MB")
      return 1024 * 1024 * max
    else if(units === "KB")
      return 1024 * max
    return max
}

export const mapAcceptableFileTypes = (types:string[]) => {
    const mappedTypes : Array<string> = Array.from(types.map(t => {
        if(t === "pdf")
            return "application/pdf"
        if(t === "docx")
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        return ""
    }))
    return mappedTypes
}

export const buildFileTypeString = (types:string[]) => {
    let result: string = ""
    for(let i = 0; i < types.length; i++){
        result += types[i]
        if(i != types.length - 1)
            result += " nebo "
    }
    return result
}
