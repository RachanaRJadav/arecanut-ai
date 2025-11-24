"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Camera, BarChart3, History, CheckCircle, TrendingUp, Download, Eye, LogOut, Calendar, Filter, ArrowUpRight, X, Plus, Trash2, Star, Lightbulb, Target, Zap, Users, Bell, Settings, RefreshCw } from 'lucide-react'
import Link from "next/link"
import { AuthGuard } from "@/components/ui/auth-guard"
import { useRouter } from 'next/navigation'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface GradingResult {
  _id?: string
  grade: "Premium" | "Grade A" | "Grade B" | "Grade C"
  confidence: number
  defects: string[]
  size: string
  color: string
  createdAt: string
  imageUrl: string
  marketPrice: number
  recommendations: string[]
  qualityScore: number
  moistureContent: number
  location?: string
  batchId?: string
}

interface BatchUpload {
  id: string
  images: File[]
  status: "pending" | "processing" | "completed" | "failed"
  results: GradingResult[]
  createdAt: string
}

function DashboardContent() {
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentResults, setCurrentResults] = useState<GradingResult[]>([])
  const [batchUploads, setBatchUploads] = useState<BatchUpload[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [showCamera, setShowCamera] = useState(false)
  const [location, setLocation] = useState("")
  const [notes, setNotes] = useState("")
  const [userId, setUserId] = useState<string>("")
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId")
    if (storedUserId) {
      setUserId(storedUserId)
      fetchAnalytics(storedUserId)
    }
    setLoading(false)
  }, [])

  const fetchAnalytics = async (uid: string) => {
    try {
      const response = await fetch(`/api/grading/analytics?userId=${uid}`)
      const data = await response.json()
      if (data.success) {
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error("[v0] Error fetching analytics:", error)
    }
  }

  const [recentResults, setRecentResults] = useState<GradingResult[]>([])

  useEffect(() => {
    if (userId) {
      fetchRecentGradings(userId)
    }
  }, [userId])

  const fetchRecentGradings = async (uid: string) => {
    try {
      const response = await fetch(`/api/grading/history?userId=${uid}&limit=10`)
      const data = await response.json()
      if (data.success) {
        setRecentResults(data.history)
      }
    } catch (error) {
      console.error("[v0] Error fetching recent results:", error)
    }
  }

  const monthlyTrends = analytics?.monthlyTrends || []
  const qualityDistribution = [
    { name: "Premium", value: analytics?.gradeDistribution?.Premium || 0, color: "#22c55e" },
    { name: "Grade A", value: analytics?.gradeDistribution?.GradeA || 0, color: "#3b82f6" },
    { name: "Grade B", value: analytics?.gradeDistribution?.GradeB || 0, color: "#eab308" },
    { name: "Grade C", value: analytics?.gradeDistribution?.GradeC || 0, color: "#f97316" },
  ]

  const priceComparison = [
    { grade: "Premium", yourPrice: 450, marketAvg: 400, difference: 50 },
    { grade: "Grade A", yourPrice: 380, marketAvg: 350, difference: 30 },
    { grade: "Grade B", yourPrice: 320, marketAvg: 300, difference: 20 },
    { grade: "Grade C", yourPrice: 300, marketAvg: 280, difference: 20 },
  ]

  const defectAnalysis = [
    { defect: "Minor surface marks", count: 10, percentage: 33.3 },
    { defect: "Slight discoloration", count: 8, percentage: 26.7 },
    { defect: "Small cracks", count: 6, percentage: 20 },
  ]

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"))

    if (files.length > 0) {
      setSelectedImages((prev) => [...prev, ...files])
    }
  }, [])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      setSelectedImages((prev) => [...prev, ...files])
    }
  }

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAnalyze = async () => {
    if (selectedImages.length === 0 || !userId) return

    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setCurrentResults([])
    setError("")

    const batchId = `BATCH-${Date.now()}`

    try {
      const formData = new FormData()
      selectedImages.forEach((file) => formData.append("files", file))
      formData.append("userId", userId)
      formData.append("batchId", batchId)
      formData.append("location", location)
      formData.append("notes", notes)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setAnalysisProgress((prev) => Math.min(prev + 15, 90))
      }, 300)

      const response = await fetch("/api/grading/analyze", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)

      const data = await response.json()

      if (data.success) {
        setCurrentResults(data.results)
        setAnalysisProgress(100)

        const newBatch: BatchUpload = {
          id: batchId,
          images: selectedImages,
          status: "completed",
          results: data.results,
          createdAt: new Date().toISOString(),
        }

        setBatchUploads((prev) => [newBatch, ...prev])
        setSelectedImages([])
        setLocation("")
        setNotes("")
        fetchAnalytics(userId)
        fetchRecentGradings(userId)
      } else {
        setError(data.message || "Analysis failed. Please try again.")
      }
    } catch (error) {
      console.error("[v0] Analysis error:", error)
      setError("Error analyzing images. Please check your network connection.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setShowCamera(true)
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      setError("Could not access camera. Please grant camera permissions.")
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext("2d")
      ctx?.drawImage(video, 0, 0)

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" })
          setSelectedImages((prev) => [...prev, file])
        }
      })

      stopCamera()
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
    }
    setShowCamera(false)
  }

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userId")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("userName")
    router.push("/")
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "Premium":
        return "bg-green-100 text-green-800 border-green-200"
      case "Grade A":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Grade B":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Grade C":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const exportResults = () => {
    if (currentResults.length === 0) return

    const data = currentResults.map((result) => ({
      Grade: result.grade,
      Confidence: `${result.confidence}%`,
      Size: result.size,
      Color: result.color,
      "Market Price": `₹${result.marketPrice}/kg`,
      "Quality Score": result.qualityScore.toFixed(1),
      "Moisture Content": `${result.moistureContent}%`,
      Location: result.location || "N/A",
      Timestamp: result.createdAt,
      Recommendations: result.recommendations.join("; "),
    }))

    const header = Object.keys(data[0]).join(",")
    const rows = data.map((row) => Object.values(row).map(v => `"${v}"`).join(","))
    const csvContent = [header, ...rows].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `arecanut-grading-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ... existing header ... */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">ArecaAI Pro</span>
            </Link>
            <Badge variant="secondary" className="ml-2">
              <Zap className="w-3 h-3 mr-1" />
              Pro
            </Badge>
          </div>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={exportResults} disabled={currentResults.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* ... existing code up to tabs ... */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">AI Grading Dashboard</h1>
              <p className="text-muted-foreground">Advanced Arecanut quality assessment with batch processing</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-600 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                System Online
              </Badge>
              <Button variant="outline" size="sm" onClick={() => userId && fetchAnalytics(userId)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Total Scans</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">
                {analytics?.totalSamples ? analytics.totalSamples.toLocaleString() : "0"}
              </p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">Avg Quality</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">
                {analytics?.averageQualityScore !== undefined ? analytics.averageQualityScore.toFixed(1) : "N/A"}/10
              </p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Premium %</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">
                {analytics?.premiumPercentage !== undefined ? analytics.premiumPercentage.toFixed(1) : "0"}%
              </p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Market Price</span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">
                ₹{analytics?.averagePrice !== undefined ? analytics.averagePrice.toFixed(0) : "0"}
              </p>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="grade" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="grade">Smart Grading</TabsTrigger>
            <TabsTrigger value="history">History & Batches</TabsTrigger>
            <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="grade" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Batch Image Upload
                    </CardTitle>
                    <CardDescription>
                      Upload multiple images for batch processing or use camera for instant capture
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragActive ? "border-primary bg-primary/5" : "border-border"
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      {selectedImages.length > 0 ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                            {selectedImages.map((file, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={URL.createObjectURL(file) || "/placeholder.svg"}
                                  alt={`Selected ${index + 1}`}
                                  className="w-full h-20 object-cover rounded-lg"
                                />
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="absolute -top-2 -right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => removeImage(index)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {selectedImages.length} image{selectedImages.length > 1 ? "s" : ""} selected
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                          <div>
                            <p className="text-foreground font-medium">Drop images here or click to upload</p>
                            <p className="text-sm text-muted-foreground">
                              PNG, JPG up to 10MB each • Batch processing supported
                            </p>
                          </div>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={startCamera} className="flex-1 bg-transparent">
                        <Camera className="w-4 h-4 mr-2" />
                        Use Camera
                      </Button>
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
                        <Plus className="w-4 h-4 mr-2" />
                        Add More
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedImages([])}
                        disabled={selectedImages.length === 0}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location/Block</Label>
                        <Input
                          id="location"
                          placeholder="e.g., Farm Block A"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Input
                          id="notes"
                          placeholder="Optional notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleAnalyze}
                      disabled={selectedImages.length === 0 || isAnalyzing}
                      className="w-full"
                      size="lg"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Analyzing {selectedImages.length} image{selectedImages.length > 1 ? "s" : ""}...
                        </>
                      ) : (
                        <>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Analyze Quality ({selectedImages.length} image{selectedImages.length > 1 ? "s" : ""})
                        </>
                      )}
                    </Button>

                    {isAnalyzing && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Processing batch...</span>
                          <span>{Math.round(analysisProgress)}%</span>
                        </div>
                        <Progress value={analysisProgress} />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {showCamera && (
                  <Card className="fixed inset-4 z-50 bg-background">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Camera Capture</CardTitle>
                        <Button variant="ghost" size="sm" onClick={stopCamera}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <video ref={videoRef} autoPlay playsInline className="w-full max-h-96 object-cover rounded-lg" />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="flex gap-2">
                        <Button onClick={capturePhoto} className="flex-1">
                          <Camera className="w-4 h-4 mr-2" />
                          Capture Photo
                        </Button>
                        <Button variant="outline" onClick={stopCamera}>
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Batch Results
                    </CardTitle>
                    <CardDescription>
                      {currentResults.length > 0
                        ? `${currentResults.length} image${currentResults.length > 1 ? "s" : ""} analyzed`
                        : "Results will appear here after analysis"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isAnalyzing ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-foreground font-medium">Analyzing batch...</p>
                        <p className="text-sm text-muted-foreground">Processing {selectedImages.length} images</p>
                      </div>
                    ) : currentResults.length > 0 ? (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {currentResults.map((result, index) => (
                          <div key={result._id || index} className="border border-border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge className={`${getGradeColor(result.grade)}`}>{result.grade}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {result.confidence.toFixed(1)}% confidence
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Size:</span>
                                <p className="font-medium">{result.size}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Score:</span>
                                <p className="font-medium">{result.qualityScore.toFixed(1)}/10</p>
                              </div>
                            </div>

                            <div className="p-3 bg-primary/5 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                <span className="font-semibold text-foreground">
                                  ₹{result.marketPrice.toFixed(0)}/kg
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">Market price estimate</p>
                            </div>

                            {result.recommendations.length > 0 && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <Lightbulb className="w-3 h-3 text-yellow-500" />
                                  <span className="text-xs font-medium text-foreground">Recommendations:</span>
                                </div>
                                {result.recommendations.slice(0, 2).map((rec, i) => (
                                  <p key={i} className="text-xs text-muted-foreground">
                                    • {rec}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Upload images to see grading results</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {currentResults.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Batch Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="text-center p-2 bg-muted rounded">
                          <p className="font-semibold text-foreground">
                            {Math.round(
                              (currentResults.reduce((acc, r) => acc + r.qualityScore, 0) / currentResults.length) * 10,
                            ) / 10}
                          </p>
                          <p className="text-muted-foreground">Avg Score</p>
                        </div>
                        <div className="text-center p-2 bg-muted rounded">
                          <p className="font-semibold text-foreground">
                            ₹
                            {Math.round(
                              currentResults.reduce((acc, r) => acc + r.marketPrice, 0) / currentResults.length,
                            )}
                          </p>
                          <p className="text-muted-foreground">Avg Price</p>
                        </div>
                      </div>

                      <Alert>
                        <Lightbulb className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {currentResults.filter((r) => r.grade === "Premium").length > currentResults.length / 2
                            ? "Excellent batch quality! Consider premium market channels."
                            : "Good batch overall. Focus on drying consistency for better grades."}
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Recent Gradings
                </CardTitle>
                <CardDescription>View your previous quality assessments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentResults.length > 0 ? (
                    recentResults.map((result) => (
                      <div
                        key={result._id}
                        className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <img
                          src={result.imageUrl || "/placeholder.svg"}
                          alt="Arecanut sample"
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`${getGradeColor(result.grade)} text-xs`}>{result.grade}</Badge>
                            <span className="text-sm text-muted-foreground">{result.confidence}% confidence</span>
                          </div>
                          <p className="text-sm text-foreground font-medium">
                            {result.size} • {result.color}
                          </p>
                          <p className="text-xs text-muted-foreground">{result.createdAt}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">₹{result.marketPrice}/kg</p>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No gradings yet. Start by uploading images above.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Analytics Overview</h2>
                <p className="text-muted-foreground">Comprehensive insights into your Arecanut quality trends</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Samples</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {analytics?.totalSamples?.toLocaleString() || "0"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Premium Grade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {analytics?.premiumPercentage?.toFixed(1) || "0"}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Price</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    ₹{analytics?.averagePrice?.toFixed(0) || "0"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Quality Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {analytics?.averageQualityScore?.toFixed(1) || "0"}/10
                  </div>
                </CardContent>
              </Card>
            </div>

            {monthlyTrends.length > 0 && (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quality Trends Over Time</CardTitle>
                    <CardDescription>Monthly breakdown of grade distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        premium: { label: "Premium", color: "#22c55e" },
                        gradeA: { label: "Grade A", color: "#3b82f6" },
                        gradeB: { label: "Grade B", color: "#eab308" },
                        gradeC: { label: "Grade C", color: "#f97316" },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Line type="monotone" dataKey="premium" stroke="#22c55e" strokeWidth={2} name="Premium %" />
                          <Line type="monotone" dataKey="gradeA" stroke="#3b82f6" strokeWidth={2} name="Grade A %" />
                          <Line type="monotone" dataKey="gradeB" stroke="#eab308" strokeWidth={2} name="Grade B %" />
                          <Line type="monotone" dataKey="gradeC" stroke="#f97316" strokeWidth={2} name="Grade C %" />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Current Quality Distribution</CardTitle>
                    <CardDescription>Breakdown of your Arecanut grades</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        premium: { label: "Premium", color: "#22c55e" },
                        gradeA: { label: "Grade A", color: "#3b82f6" },
                        gradeB: { label: "Grade B", color: "#eab308" },
                        gradeC: { label: "Grade C", color: "#f97316" },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={qualityDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {qualityDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Price Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {priceComparison.map((item) => (
                      <div key={item.grade} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge className={getGradeColor(item.grade)} variant="outline">
                            {item.grade}
                          </Badge>
                          <div>
                            <p className="font-semibold text-foreground">₹{item.yourPrice}/kg</p>
                            <p className="text-xs text-muted-foreground">Market: ₹{item.marketAvg}/kg</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3 text-green-600" />
                            <span className="text-sm font-semibold text-green-600">+₹{item.difference}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Common Defects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {defectAnalysis.map((defect, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{defect.defect}</span>
                          <span className="text-sm font-semibold text-foreground">{defect.percentage}%</span>
                        </div>
                        <Progress value={defect.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}
