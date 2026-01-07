import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import FlowerCard from '@/components/cards/flowercard';
import { useTheme } from '@/theme/global';
import ResultCard from '@/components/cards/resultCard';
import QuizHeader from '@/components/headers/header';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/config';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

const index = () => {

  const [email, setEmail] = useState("");      
  const [password, setPassword] = useState(""); 
  const [courses, setCourses] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const { typography } = theme;
  const { student } = useAuth();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const coursesEndpoint = student?.classId ? ENDPOINTS.courses.byClass(String(student.classId)) : ENDPOINTS.courses.list;
        if (!student?.matricule) throw new Error('Missing student matricule');
        const [coursesRes, evalsRes, notifRes] = await Promise.all([
          api.get<any[]>(coursesEndpoint),
          api.get<any[]>(ENDPOINTS.evaluations.listByStudent(String(student.matricule))),
          api.get<any[]>(ENDPOINTS.notifications.list),
        ]);
        setCourses(Array.isArray(coursesRes) ? coursesRes : []);
        const normalized = (Array.isArray(evalsRes) ? evalsRes : []).map((e: any, idx: number) => ({
          id: Number(e?.id ?? e?.evaluationId ?? idx),
          status: e?.status,
          type: e?.type,
          courseCode: e?.courseCode,
          courseName: e?.courseName,
          questions: Array.isArray(e?.questions) ? e?.questions : [],
        }));
        const publishedOnly = normalized.filter((e: any) => String(e?.status || '').toLowerCase() === 'published');
        setEvaluations(publishedOnly);
        setNotifications(Array.isArray(notifRes) ? notifRes : []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
  }, [student?.classId]);
    return (
    <View style= {styles.container}>
      <QuizHeader/>
             <FlowerCard 
  greeting={`Hello ${([student?.firstName, student?.lastName].filter(Boolean).join(' ') || 'there')}`}
  />
      <Text style={[{fontFamily:typography.fontFamily.heading, marginTop:5,},styles.title]}>Hello {([student?.firstName, student?.lastName].filter(Boolean).join(' ') || 'there')}</Text>
      <View style={{ alignSelf:"center"}}>
      </View>
      
      <Text style={[{fontFamily:typography.fontFamily.heading, marginTop:18},styles.title]}>Recent Tests</Text>
      {evaluations.slice(0, 3).map((ev, idx) => {
        const id = Number(ev?.id ?? ev?.evaluationId ?? idx);
        const qCount = Array.isArray(ev?.questions) ? ev.questions.length : (Number(ev?.questionCount) || 0);
        return (
          <TouchableOpacity key={String(id)} activeOpacity={0.8} onPress={() => router.push({ pathname: '/(tabs)/test', params: { evaluationId: String(id) } })}>
            <ResultCard
              typeLabel={ev?.type || 'Evaluation'}
              courseCode={ev?.courseCode || ''}
              courseName={ev?.courseName || ''}
              progress={qCount}
              total={qCount}
            />
          </TouchableOpacity>
        );
      })}

<View style={styles.headerRow}>
  <Text
    style={[
      { fontFamily: typography.fontFamily.heading },
      styles.title,
    ]}
  >
    Courses
  </Text>

  <TouchableOpacity
    onPress={() => router.push("/(tabs)/stats")}
    activeOpacity={0.7}
    style={styles.viewAllButton}
  >
    <Text style={styles.viewAllText}>View all</Text>
  </TouchableOpacity>
</View>




    </View>
  )
}

export default index

const styles = StyleSheet.create({
  container:{
  paddingTop:40,
  backgroundColor: '#f2e6f7',
  flex:1
  },  
   title: {
    marginLeft:15,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "left",
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 15,
    marginTop: 18,
    marginBottom: 6,
  },


  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#331424',
  },

  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#331424',
  },

  /* existing styles */
  card: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#331424',
    width: 362,
    elevation: 3,
    marginLeft: 15,
    marginRight: 15,
  },

  icon: {
    width: 32,
    height: 32,
    marginRight: 12,
  },

  courseCode: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 4,
    color: '#331424',
  },

  courseName: {
    fontSize: 14,
    color: '#555',
  },
})