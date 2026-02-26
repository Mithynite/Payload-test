type MimeType = `${string}/${string}`;

export const calculateMaxFileSize = (units:string, max:number) => {
    if(units === "MB")
      return 1024 * 1024 * max
    else if(units === "KB")
      return 1024 * max
    return max
}

export const mapAcceptableFileTypes = (types:string[]):MimeType[] => {
   /* const mappedTypes : Array<string> = Array.from(types.map(t => {
        if(t === "pdf")
            return "application/pdf"
        if(t === "docx")
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        return ""
    }))*/
    const remappedTypes : Record<string,string> = {
        pdf: `${"application"}/${"pdf"}`,
        docx: `${"application"}/${"vnd.openxmlformats-officedocument.wordprocessingml.document"}`
    }
    return types.map(t => remappedTypes[t]).filter((v): v is `${string}/${string}` => Boolean(v))
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
