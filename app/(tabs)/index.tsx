import { StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import FlowerCard from '@/components/cards/flowercard';
import { useTheme } from '@/theme/global';
import ResultCard from '@/components/cards/resultCard';
import QuizHeader from '@/components/headers/header';

const index = () => {

  const [email, setEmail] = useState("");      
  const [password, setPassword] = useState(""); 
  const theme = useTheme();
  const { typography } = theme;
    return (
    <View style= {styles.container}>
      <QuizHeader/>
      <Text style={[{fontFamily:typography.fontFamily.heading, marginTop:5,},styles.title]}>Hello Astera-Lainey</Text>
      <View style={{ alignSelf:"center"}}>
       <FlowerCard/> 
      </View>
      
      <Text style={[{fontFamily:typography.fontFamily.heading, marginTop:18},styles.title]}>Recent Tests</Text>
  <ResultCard
  title="Math for engineers"
  progress={17}
  total={20}
/>
  <ResultCard
  title="Math for engineers"
  progress={20}
  total={20}
/>
  <ResultCard
  title="Math for engineers"
  progress={15}
  total={20}
/>


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