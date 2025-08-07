import { Request, Response } from "express";

export interface CredimaxPayment {
  amount: number;
  currency: string;
  orderId: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
}

export async function createCredimaxTransaction(req: Request, res: Response) {
  try {
    const { amount, currency = "BHD", orderId, customerInfo }: CredimaxPayment = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    if (!orderId || !customerInfo) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // In production, you would integrate with Credimax's actual API
    // For now, we'll simulate the payment process
    const credimaxResponse = {
      transactionId: `CREDIMAX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "pending",
      paymentUrl: `https://credimax.com.bh/pay?transaction=${orderId}&amount=${amount}`,
      amount,
      currency,
      orderId,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    };

    res.json(credimaxResponse);
  } catch (error: any) {
    console.error("Credimax error:", error);
    res.status(500).json({ error: "Failed to create Credimax transaction" });
  }
}

export async function verifyCredimaxTransaction(req: Request, res: Response) {
  try {
    const { transactionId } = req.params;

    if (!transactionId) {
      return res.status(400).json({ error: "Transaction ID is required" });
    }

    // In production, you would verify with Credimax's API
    // For now, we'll simulate verification
    const verificationResult = {
      transactionId,
      status: "completed", // or "failed", "pending"
      amount: 50.00, // This would come from Credimax
      currency: "BHD",
      timestamp: new Date().toISOString(),
    };

    res.json(verificationResult);
  } catch (error: any) {
    console.error("Credimax verification error:", error);
    res.status(500).json({ error: "Failed to verify Credimax transaction" });
  }
}

export async function handleCredimaxWebhook(req: Request, res: Response) {
  try {
    // In production, you would verify the webhook signature from Credimax
    const { transactionId, status, amount, orderId } = req.body;

    console.log("Credimax webhook received:", {
      transactionId,
      status,
      amount,
      orderId,
    });

    // Handle the webhook data - update order status, etc.
    
    res.status(200).json({ success: true, message: "Webhook processed successfully" });
  } catch (error: any) {
    console.error("Credimax webhook error:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
}