// Shared hash for the exact preview the user reviewed. Does not require bank credentials.
export async function reviewDigestV41(bankLabel:string,paymentMethod:string,rows:unknown[]):Promise<string>{
 const canonical=JSON.stringify({bankLabel:bankLabel.toLowerCase().trim(),paymentMethod,rows});
 const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical));
 return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");
}