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
        const [coursesRes, evalsRes, notifRes] = await Promise.all([
          api.get<any[]>(coursesEndpoint),
          api.get<any[]>(ENDPOINTS.evaluations.list),
          api.get<any[]>(ENDPOINTS.notifications.list),
        ]);
        setCourses(Array.isArray(coursesRes) ? coursesRes : []);
        setEvaluations(Array.isArray(evalsRes) ? evalsRes : []);
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

      <Text style={[{fontFamily:typography.fontFamily.heading, marginTop:18},styles.title]}>Courses</Text>
      {error ? <Text style={{ color: 'red', marginHorizontal: 15 }}>{error}</Text> : null}
      {loading ? (
        <Text style={{ marginHorizontal: 15 }}>Loading courses...</Text>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item, idx) => String(item?.courseCode || idx)}
          renderItem={({ item }) => (
            <Text style={{ marginHorizontal: 15, marginBottom: 6, fontFamily: typography.fontFamily.body }}>
              {item?.courseCode || 'N/A'} — {item?.courseName || ''}
            </Text>
          )}
        />
      )}

      <Text style={[{fontFamily:typography.fontFamily.heading, marginTop:18},styles.title]}>Notifications</Text>
      {notifications.length === 0 ? (
        <Text style={{ marginHorizontal: 15, fontFamily: typography.fontFamily.body }}>No notifications</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item, idx) => String(item?.id || idx)}
          renderItem={({ item }) => (
            <Text style={{ marginHorizontal: 15, marginBottom: 6, fontFamily: typography.fontFamily.body }}>
              {item?.title || 'Notification'}: {item?.message || ''}
            </Text>
          )}
        />
      )}


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
})