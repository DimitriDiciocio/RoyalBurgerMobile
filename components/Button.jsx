import {StyleSheet, View, Text, TouchableOpacity} from 'react-native';

export default function ButtonDark({ texto }) {
    return (
        <View>
            <TouchableOpacity style={[styles.buttonDark]} onPress={() => {}}>
                <Text style={[styles.textoBnt]} > {texto} </Text>
            </TouchableOpacity>
        </View>
    );
}
const styles = StyleSheet.create({
    buttonDark:{
        backgroundColor:'#101010',
        borderRadius: 7,
        width:'90',
        paddingHorizontal: 5,
        paddingVertical: 5,
    },
    textoBnt:{
        fontSize:18,
        fontWeight:'bold',
        color:'#FFFFFF',
        alignSelf: 'center',
        justifyContent:'center',
    }
})