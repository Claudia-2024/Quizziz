// TestQuizPage.tsx
import QuizHeader from '@/components/headers/header';
import {BlurView} from 'expo-blur';
import {router} from 'expo-router';
import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Modal,
    FlatList,
    Image,
    ImageBackground,
    ActivityIndicator,
} from 'react-native';
import {useLocalSearchParams} from 'expo-router';
import {api} from '@/lib/api';
import {ENDPOINTS} from '@/lib/config';
import ResultCard from '@/components/cards/resultCard';

type EvalOption = { id: number; text: string };
type EvalQuestion = {
    id: number;
    text: string;
    options: EvalOption[];
};

type Evaluation = {
    id?: number; // may not exist in payload; we'll synthesize an id
    publishedDate?: string; // e.g., '2025-12-29'
    type?: string; // e.g., 'Mid Term'
    startTime?: string; // '08:00:00'
    endTime?: string; // '11:00:00'
    courseCode?: string; // 'ISI4217'
    courseName?: string; // e.g., 'Linear Algebra'
    status?: string; // new attribute: 'published', 'completed', etc.
    questions?: Array<{
        questionId?: number;
        text?: string;
        type?: string;
        points?: number;
        choices?: Array<{
            choiceId?: number;
            text?: string;
            order?: number;
            isCorrect?: boolean;
        }>;
    }>;
};

function pickArray(data: any): any[] {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.rows)) return data.rows;
    return [];
}

const TestQuizPage: React.FC = () => {
    const params = useLocalSearchParams();
    const routeEvaluationId = params?.evaluationId as string | undefined;

    const [testReady, setTestReady] = useState(false);
    const [showNotReadyModal, setShowNotReadyModal] = useState(false);
    const [showReadyModal, setShowReadyModal] = useState(false);
    const [testStarted, setTestStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [questions, setQuestions] = useState<EvalQuestion[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [selectedEvalIndex, setSelectedEvalIndex] = useState<number | null>(null);
    const mountedRef = useRef(true);

    // Overall exam timer (derived from evaluation start/end time)
    const [overallTimeLeft, setOverallTimeLeft] = useState<number>(0);
    const overallTimerRef = useRef<NodeJS.Timer | null>(null);

    // Response sheet and selections
    const [responseSheetId, setResponseSheetId] = useState<number | null>(null);
    const [selections, setSelections] = useState<Record<number, number | undefined>>({}); // questionId -> choiceId
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (!testStarted) {
            if (testReady) setShowReadyModal(true);
            else if (!loading && selectedEvalIndex !== null && (error || questions.length === 0)) setShowNotReadyModal(true);
        }
    }, [testReady, testStarted, loading, error, questions.length, selectedEvalIndex]);

    // Fetch all evaluations with embedded questions/choices
    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const evalsRaw = pickArray(await api.get<any>(ENDPOINTS.evaluations.list));
            // Normalize and sort by publishedDate ascending
            const normalized: Evaluation[] = evalsRaw.map((e: any, idx: number) => ({
                id: Number(e?.id ?? e?.evaluationId ?? idx),
                publishedDate: e?.publishedDate,
                type: e?.type,
                startTime: e?.startTime,
                endTime: e?.endTime,
                courseCode: e?.courseCode,
                courseName: e?.courseName,
                questions: Array.isArray(e?.questions) ? e.questions : [],
                // new attribute from backend to control visibility
                status: e?.status,
            }));
            // Keep only published evaluations; hide completed and others
            const publishedOnly = normalized.filter((e: any) => String(e?.status || '').toLowerCase() === 'published');

            const sorted = publishedOnly.sort((a: any, b: any) => {
                const da = a.publishedDate ? Date.parse(a.publishedDate) : 0;
                const db = b.publishedDate ? Date.parse(b.publishedDate) : 0;
                return da - db;
            });

            if (!mountedRef.current) return;
            setEvaluations(sorted);
            setTestReady(false);
        } catch (e: any) {
            if (!mountedRef.current) return;
            setError(e?.message || 'Failed to load test');
            setTestReady(false);
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [routeEvaluationId]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // Overall timer countdown
    useEffect(() => {
        if (!testStarted) return;
        if (overallTimerRef.current) clearInterval(overallTimerRef.current as any);
        overallTimerRef.current = setInterval(() => {
            setOverallTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(overallTimerRef.current as any);
                    // Auto-submit when time elapses
                    void submitEvaluation();
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => {
            if (overallTimerRef.current) clearInterval(overallTimerRef.current as any);
        };
    }, [testStarted]);

    const resetToList = () => {
        // Reset all quiz-related state and show evaluations list again
        setTestStarted(false);
        setShowCompletionModal(false);
        setShowReadyModal(false);
        setShowNotReadyModal(false);
        setSelectedOption(null);
        setCurrentQuestion(0);
        setQuestions([]);
        setTestReady(false);
        setSelectedEvalIndex(null);
        setResponseSheetId(null);
        setSelections({});
        setOverallTimeLeft(0);
        if (overallTimerRef.current) clearInterval(overallTimerRef.current as any);
    };

    function nowHMS(): string {
        const d = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    function hmsToSeconds(hms?: string): number {
        if (!hms || typeof hms !== 'string') return 0;
        const [hh, mm, ss] = hms.split(':').map((x) => parseInt(x || '0', 10));
        return (hh || 0) * 3600 + (mm || 0) * 60 + (ss || 0);
    }

    const handleStartTest = async () => {
        try {
            if (selectedEvalIndex === null) return;
            const evalItem = evaluations[selectedEvalIndex];
            const evaluationId = Number(evalItem?.id);
            const clientStartTime = nowHMS();
            // Call start API → expect { responseSheetId }
            const res = await api.post<any>(ENDPOINTS.evaluations.start(String(evaluationId)), { clientStartTime });
            const respId = Number(res?.responseSheetId ?? res?.id ?? res?.responseId);
            if (!Number.isFinite(respId)) {
                throw new Error('Failed to start evaluation');
            }
            setResponseSheetId(respId);

            // Compute overall duration from evaluation start/end times
            const dur = Math.max(0, hmsToSeconds(evalItem?.endTime) - hmsToSeconds(evalItem?.startTime));
            setOverallTimeLeft(dur > 0 ? dur : 0);

            setTestStarted(true);
            setShowReadyModal(false);
        } catch (e: any) {
            setError(e?.message || 'Unable to start test');
        }
    };

    const saveCurrentAnswer = async () => {
        try {
            if (!responseSheetId) return;
            const q = questions[currentQuestion];
            if (!q || selectedOption == null) return;
            setSaving(true);
            const payload = { answers: [{ questionId: q.id, choiceId: selectedOption }] };
            await api.post(ENDPOINTS.evaluations.saveAnswers(String(responseSheetId)), payload);
            setSelections((prev) => ({ ...prev, [q.id]: selectedOption ?? prev[q.id] }));
        } catch (e) {
            // keep quiet; will retry on submit
        } finally {
            setSaving(false);
        }
    };

    const handleNextQuestion = async () => {
        // Save current answer before moving on
        await saveCurrentAnswer();
        setSelectedOption(null);
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(q => q + 1);
        } else {
            // Final question → submit
            await submitEvaluation();
            setShowCompletionModal(true);
        }
    };

    const submitEvaluation = async () => {
        try {
            if (!responseSheetId) return;
            if (submitting) return;
            setSubmitting(true);

            // Build full answers from selections + current selectedOption
            const all: Array<{ questionId: number; choiceId: number }> = [];
            const mapSel: Record<number, number | undefined> = { ...selections };
            const currQ = questions[currentQuestion];
            if (currQ && selectedOption != null) {
                mapSel[currQ.id] = selectedOption;
            }
            for (const q of questions) {
                const cid = mapSel[q.id];
                if (cid != null) all.push({ questionId: q.id, choiceId: cid });
            }

            const clientSubmitTime = nowHMS();
            const payload = { clientSubmitTime, answers: all };
            await api.post(ENDPOINTS.evaluations.submit(String(responseSheetId)), payload);
        } catch (e) {
            setError((e as any)?.message || 'Failed to submit test');
        } finally {
            setSubmitting(false);
        }
    };

    if (testStarted) {
        const question = questions[currentQuestion];

        return (
            <View style={styles.container}>
                {/* Progress */}
                <Text style={styles.progress}>{`${currentQuestion + 1} of ${questions.length} `}</Text>

                {/* QUESTION CARD WRAPPED IN IMAGEBACKGROUND */}
                <ImageBackground
                    source={require("../../assets/images/leaf.png")}
                    style={styles.background}
                    imageStyle={{borderRadius: 20}}
                >
                    <BlurView tint="dark"/>
                    <View style={styles.colorTint}/>

                    <View style={styles.questionCard}>

                        {/* OVERALL TIMER */}
                        <View style={styles.timerContainer}>
                            <View style={styles.timerCircle}>
                                <Text style={styles.timerText}>{overallTimeLeft}</Text>
                            </View>
                        </View>
                        {/* QUESTION NUMBER */}
                        <Text style={styles.questionLabel}>
                            {`Question ${String(question.id).padStart(2, '0')}`}
                        </Text>

                        {/* QUESTION TEXT */}
                        <Text style={styles.questionText}>{question.text}</Text>
                    </View>
                </ImageBackground>

                {/* ANSWERS CARD */}
                <View style={styles.answersCard}>
                    <FlatList
                        data={question.options}
                        keyExtractor={(it) => String(it.id)}
                        renderItem={({item, index}) => {
                            const letter = String.fromCharCode(65 + index);
                            const selected = selectedOption === item.id;

                            return (
                                <TouchableOpacity
                                    style={[styles.optionCard, selected && styles.optionSelected]}
                                    onPress={() => setSelectedOption(item.id)}
                                >
                                    <Text style={styles.optionLetter}>{letter}.</Text>
                                    <Text style={styles.optionText}>{item.text}</Text>
                                </TouchableOpacity>
                            );
                        }}
                    />

                    {/* PREVIOUS / NEXT */}
                    <View style={styles.navRow}>
                        <TouchableOpacity
                            style={[styles.navButton, styles.prevButton, currentQuestion === 0 && {opacity: 0.8}]}
                            disabled={currentQuestion === 0}
                            onPress={() => setCurrentQuestion(q => q - 1)}
                        >
                            <Text style={styles.navText}>Previous</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.navButton, styles.nextButton, !selectedOption && {opacity: 0.6}]}
                            disabled={!selectedOption}
                            onPress={handleNextQuestion}
                        >
                            <Text style={styles.navText}>
                                {currentQuestion === questions.length - 1 ? 'Submit' : 'Next'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* COMPLETION MODAL */}
                <Modal visible={showCompletionModal} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Test Completed!</Text>
                            <Image
                                source={require("../../assets/icons/success.gif")}
                                style={{width: 90, height: 90, marginBottom: 15}}
                            />
                            <Text style={styles.modalText}>You have successfully finished the test.</Text>
                            <TouchableOpacity
                                style={styles.startButton}
                                onPress={() => {
                                    // Return to the list of evaluations on the Test page
                                    resetToList();
                                }}
                            >
                                <Text style={styles.startButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }

    /* LIST OR MODALS */
    return (
        <View style={styles.container}>
            {loading && (
                <View style={{alignItems: 'center', justifyContent: 'center', padding: 24}}>
                    <ActivityIndicator size="large" color="#4B1F3B"/>
                    <Text style={{marginTop: 12}}>Loading test…</Text>
                </View>
            )}

            {!loading && !testStarted && selectedEvalIndex === null && !showNotReadyModal && !showReadyModal && (
                <View>
                    <Text style={[ {marginBottom: 12}]}>Upcoming Evaluations</Text>
                    {evaluations.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Image
                                source={require("../../assets/icons/process.png")}
                                style={{width: 80, height: 80, marginBottom: 12, opacity: 0.85}}
                            />
                            <Text style={styles.emptyTitle}>No test available right now</Text>
                            {error ? (
                                <Text style={styles.emptySubtitle}>{error}</Text>
                            ) : (
                                <Text style={styles.emptySubtitle}>Please check back later.</Text>
                            )}
                            <View style={styles.emptyActions}>
                                <TouchableOpacity style={[styles.startButton, {flex: 1}]}
                                                  onPress={() => router.push('/(tabs)')}>
                                    <Text style={styles.startButtonText}>Go Home</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.startButton, {flex: 1, backgroundColor: '#6b2a66'}]}
                                    onPress={fetchAll}
                                >
                                    <Text style={styles.startButtonText}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <FlatList
                            data={evaluations}
                            keyExtractor={(item, idx) => String(item.id ?? idx)}
                            renderItem={({item, index}) => {
                                const code = item.courseCode || '';
                                const name = item.courseName || '';
                                const title = `${item.type || 'Evaluation'} — ${[code, name].filter(Boolean).join(' — ')}`.trim();
                                const qCount = Array.isArray(item.questions) ? item.questions.length : 0;
                                return (
                                    <TouchableOpacity
                                        activeOpacity={0.85}
                                        onPress={() => {
                                            // Prepare questions from the selected evaluation
                                            setSelectedEvalIndex(index);
                                            const qs = (item.questions || [])
                                                .map((q: any, qIdx: number) => ({
                                                    id: Number(q?.questionId ?? qIdx),
                                                    text: String(q?.text ?? 'Question'),
                                                    options: ((q?.choices || []) as any[])
                                                        .slice()
                                                        .sort((a, b) => (Number(a?.order || 0) - Number(b?.order || 0)))
                                                        .map((c: any, i: number) => ({ id: Number(c?.choiceId ?? i), text: String(c?.text ?? '') })),
                                                }))
                                                .filter(q => Number.isFinite(q.id));
                                            setQuestions(qs);
                                            setTestReady(qs.length > 0);
                                            if (qs.length === 0) {
                                                setShowNotReadyModal(true);
                                            } else {
                                                setShowReadyModal(true);
                                            }
                                        }}
                                        style={{ marginBottom: 12 }}
                                    >
                                        <ResultCard
                                            typeLabel={item.type || 'Evaluation'}
                                            courseCode={code}
                                            courseName={name}
                                            progress={qCount}
                                            total={qCount}
                                        />
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    )}
                </View>
            )}
            <Modal visible={showReadyModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Your Test is Ready</Text>
                        <Image
                            source={require("../../assets/icons/process.png")}
                            style={{width: 90, height: 90, marginBottom: 15}}
                        />
                        <Text style={styles.modalText}>Your test has been uploaded click below to start!</Text>
                        <TouchableOpacity style={styles.startButton} onPress={handleStartTest}>
                            <Text style={styles.startButtonText}>Start Test</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={showNotReadyModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Test Not Ready</Text>
                        {error ? (
                            <Text style={styles.modalText}>{error}</Text>
                        ) : (
                            <Text style={styles.modalText}>No questions are available at this time.</Text>
                        )}
                        <TouchableOpacity
                            style={styles.startButton}
                            onPress={() => {
                                // Close and reset to the evaluations list (including empty fallback if none)
                                resetToList();
                            }}
                        >
                            <Text style={styles.startButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default TestQuizPage;

/* ================== STYLES ================== */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2e6f7',
        paddingTop: 60,
        paddingHorizontal: 20,
    },

    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        paddingHorizontal: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 6,
        color: '#331424',
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6f6a73',
        marginBottom: 16,
        textAlign: 'center',
    },
    emptyActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },

    progress: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 10,
    },

    background: {
        borderRadius: 20,
        marginBottom: 20,
    },


    colorTint: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(43,16,46,0.9)',
        borderRadius: 25
    },

    questionCard: {
        backgroundColor: 'transparent',
        borderRadius: 16,
        padding: 20,
    },

    questionLabel: {
        color: '#FF2F92',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 10,
        textAlign: 'center',
    },

    timerContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },

    timerCircle: {
        width: 100,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF2F92',
        shadowColor: '#FF2F92',
        shadowOpacity: 0.6,
        shadowOffset: {width: 0, height: 0},
        shadowRadius: 10,
        elevation: 8,
    },

    timerText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 18,
    },

    questionText: {
        color: '#FFF',
        fontSize: 17,
        lineHeight: 24,
        textAlign: 'center',
    },

    answersCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
    },

    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },

    optionSelected: {
        backgroundColor: '#FFE1EE',
    },

    optionLetter: {
        fontWeight: 'bold',
        marginRight: 10,
        fontSize: 16,
    },

    optionText: {
        fontSize: 16,
    },

    navRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },

    navButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowOffset: {width: 0, height: 3},
        shadowRadius: 4,
        elevation: 5,
    },

    prevButton: {
        backgroundColor: '#331424',
        marginRight: 10,
    },

    nextButton: {
        backgroundColor: '#FF2F92',
    },

    navText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    modalContent: {
        backgroundColor: '#FFF',
        padding: 30,
        borderRadius: 14,
        width: '80%',
        alignItems: 'center',
    },

    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },

    modalText: {
        textAlign: 'center',
        fontSize: 16,
    },

    startButton: {
        backgroundColor: '#FF2F92',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
        marginTop: 20,
    },

    startButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
});
