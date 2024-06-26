import { keypairIdentity, generateSigner } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createV1 } from "@metaplex-foundation/mpl-core";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";

export const saveDataToAkord = async (data: object): Promise<string> => {
  try {
    const akordApiKey = process.env.NEXT_PUBLIC_AKORD_API_KEY;
    if (!akordApiKey) {
      throw new Error("Akord API key not found in environment variables.");
    }
    const jsonString = JSON.stringify(data);
    const response = await fetch("https://api.akord.com/files", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Api-Key": akordApiKey,
        "Content-Type": "text/plain",
      },
      body: jsonString,
    });

    if (response.ok) {
      const responseData = await response.json();
      const txId = responseData.tx.id; // Akordから返されたtxのIDを取得
      return txId;
    } else {
      throw new Error("Failed to upload data to Akord");
    }
  } catch (error) {
    console.error("Error uploading JSON file to Akord:", error);
    throw error;
  }
};

export const createNFT = async (txId: string, wallet: any) => {
  const endpoint = "https://api.devnet.solana.com";
  const umi = createUmi(endpoint);

  umi.use(walletAdapterIdentity(wallet));

  const asset = generateSigner(umi);
  const uri = `https://arweave.net/${txId}`;

  await createV1(umi, {
    asset,
    name: "My Core NFT",
    uri: uri,
  }).sendAndConfirm(umi);

  console.log("asset =>", asset.publicKey.toString());

  return asset.publicKey.toString();
};

export const createNFTUsingAkord = async (data: object, wallet: any) => {
  try {
    const txId = await saveDataToAkord(data);
    const tokenID = await createNFT(txId, wallet);
    return tokenID;
  } catch (error) {
    console.error("Error creating NFT using Akord:", error);
    throw error;
  }
};
